# Feature Flag Analytics Schema

## 1. Core Schema Design

### A. Configuration and Rules (Metadata)
These tables are the source of truth for what flags exist and who should see them.

```sql
-- 1. Main flag definitions
CREATE TABLE flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,               -- e.g., 'new_checkout_flow'
    description TEXT,
    status TEXT DEFAULT 'enabled',          -- enabled, disabled, archived
    is_killable BOOLEAN DEFAULT true,       -- flag for UI to show emergency stop
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Targeting rules
CREATE TABLE flag_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id UUID REFERENCES flags(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL,              -- order of evaluation
    attribute_name TEXT NOT NULL,           -- e.g., 'plan_type'
    operator TEXT NOT NULL,                 -- e.g., 'equals', 'in', 'gt'
    values JSONB NOT NULL,                  -- e.g., ["premium", "enterprise"]
    variation_to_serve TEXT NOT NULL,       -- 'on', 'off', or 'blue_button'
    rollout_percentage INT DEFAULT 100      -- for canary releases
);
```

### B. Analytical Events (High Volume)
This table stores every flag evaluation. This table will grow quickly; in production, use PostgreSQL table partitioning by `created_at`.

```sql
-- 3. Flag evaluations (fact table)
CREATE TABLE flag_evaluations (
    id BIGSERIAL PRIMARY KEY,
    flag_key TEXT NOT NULL,
    user_id TEXT NOT NULL,
    variation_served TEXT NOT NULL,
    reason TEXT,                            -- 'rule_match', 'kill_switch', 'default'
    context JSONB,                          -- e.g., { "version": "1.2", "region": "US" }
    request_duration_ms INT,                -- operational analytics
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for dashboard performance
CREATE INDEX idx_eval_flag_key_time ON flag_evaluations (flag_key, created_at DESC);
CREATE INDEX idx_eval_context_gin ON flag_evaluations USING GIN (context);
```

## 2. Sample Data for the Dashboard
Populate these tables to simulate a decoupled release and a kill switch event.

### Decoupling Deploy from Release (Canary)
```sql
INSERT INTO flags (key, description)
VALUES ('recommender_v2', 'New ML recommendation engine');

-- Rule: 10% of users get the new engine
INSERT INTO flag_rules (
    flag_id,
    priority,
    attribute_name,
    operator,
    values,
    variation_to_serve,
    rollout_percentage
)
VALUES (
    (SELECT id FROM flags WHERE key = 'recommender_v2'),
    1,
    'all',
    'always',
    '[]',
    'v2_engine',
    10
);
```

### Analytical Event Data
```sql
INSERT INTO flag_evaluations (flag_key, user_id, variation_served, reason, context)
VALUES
    ('recommender_v2', 'user_1', 'v2_engine', 'rule_match', '{"plan": "pro", "region": "US"}'),
    ('recommender_v2', 'user_2', 'v1_engine', 'out_of_sample', '{"plan": "free", "region": "EU"}'),
    ('recommender_v2', 'user_3', 'v1_engine', 'kill_switch', '{"plan": "pro", "region": "US"}');
```

## 3. Top 3 Dashboard Queries

### I. Adoption Rate (Targeting Success)
Show how many users hit each variation.

```sql
SELECT
    variation_served,
    COUNT(*) AS total_hits,
    (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()) AS percentage
FROM flag_evaluations
WHERE flag_key = 'recommender_v2'
GROUP BY variation_served;
```

### II. Kill Switch Effectiveness
Monitor traffic and kill switch activations over time.

```sql
SELECT
    date_trunc('minute', created_at) AS minute,
    COUNT(*) FILTER (WHERE variation_served = 'v2_engine') AS v2_traffic,
    COUNT(*) FILTER (WHERE reason = 'kill_switch') AS kill_switch_activations
FROM flag_evaluations
GROUP BY 1
ORDER BY 1 DESC;
```

### III. Contextual Breakdown (Personalization)
See which regions are receiving which variation.

```sql
SELECT
    context->>'region' AS region,
    variation_served,
    COUNT(*)
FROM flag_evaluations
GROUP BY 1, 2;
```

## Pro Tip: Managing Volume
If you expect millions of evaluations per day, avoid writing every single evaluation directly to Postgres in real time. Use a buffer/aggregator approach:

1. Collect evaluations in memory or Redis.
2. Every minute, write aggregated counts to Postgres (for example: Flag A, Variation B, 500 hits) instead of 500 individual rows.
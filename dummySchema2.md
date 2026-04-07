# Simplified Feature Gating Schema

## 1. Simplified Schema Design

### Table: features
This table defines who can access each feature.

- Decoupled release: set `released_to` to `'none'` during deployment, then switch to `'premium'` or `'all'` when ready.
- Kill switch: set `released_to` to `'none'` to disable the feature for everyone immediately.

```sql
CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,             -- e.g., 'ai_chat', 'hd_streaming'
    display_name TEXT NOT NULL,
    released_to TEXT NOT NULL CHECK (released_to IN ('none', 'premium', 'all')),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: feature_usage_logs
This is analytical data. It records every time a user accesses a feature.

```sql
CREATE TABLE feature_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    feature_key TEXT NOT NULL,
    user_tier TEXT NOT NULL,              -- 'free' or 'premium'
    success BOOLEAN DEFAULT true,         -- useful for tracking errors/performance
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 2. Sample Data (Two-Feature Scenario)
Assume the two features are AI Chat and HD Streaming.

### Current State Setup
| key | display_name | released_to | note |
| --- | --- | --- | --- |
| ai_chat | AI Assistant | premium | Only premium users see this. |
| hd_video | High Def Stream | all | Everyone sees this. |

```sql
INSERT INTO features (key, display_name, released_to)
VALUES
    ('ai_chat', 'AI Assistant', 'premium'),
    ('hd_video', 'High Def Stream', 'all');
```

## 3. How the Backend Uses This

### Authorization Check
When a user tries to access a feature, run this query:

```sql
SELECT released_to
FROM features
WHERE key = 'ai_chat';
```

### Logic
- If `released_to == 'all'`, return `TRUE`.
- If `released_to == 'premium'` and `user.tier == 'premium'`, return `TRUE`.
- Otherwise, return `FALSE`.

### Analytical Log (Tracking)
Every time the check passes, insert a row:

```sql
INSERT INTO feature_usage_logs (feature_key, user_tier)
VALUES ('ai_chat', 'premium');
```

## 4. Analytical Dashboard Queries
With this setup, the dashboard can answer the most important questions.

### A. Usage by Tier
How many free vs premium users are using each feature?

```sql
SELECT
    feature_key,
    user_tier,
    COUNT(*) AS total_uses
FROM feature_usage_logs
GROUP BY feature_key, user_tier;
```

### B. Feature Popularity
Which feature is being used more in the last 24 hours?

```sql
SELECT
    feature_key,
    COUNT(*) AS usage_count
FROM feature_usage_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY feature_key;
```

### C. Kill Switch Audit
Check whether a feature appears to have been turned off recently.

```sql
SELECT
    feature_key,
    MAX(created_at) AS last_seen
FROM feature_usage_logs
GROUP BY feature_key;
```
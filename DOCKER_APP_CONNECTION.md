# Docker to App Connection Guide

This project connects the Express app to Dockerized PostgreSQL and Redis using environment variables and Docker Compose service DNS.

## 1. Services and Connection Model

The system has three services in Docker Compose:

- `app` (Node + Express)
- `postgres` (PostgreSQL 16-alpine)
- `redis` (Redis 7-alpine)

Inside Docker, the app connects using service names:

- `postgres:5432`
- `redis:6379`

From the host machine (for local `npm test`), Docker ports are mapped to non-conflicting host ports:

- PostgreSQL: host `5433` -> container `5432`
- Redis: host `6380` -> container `6379`

## 2. Environment Variables

App connection values are controlled by:

- `DATABASE_URL`
- `REDIS_URL`

### Host-side development/testing

Use host-mapped ports:

- `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/feature_flags`
- `REDIS_URL=redis://127.0.0.1:6380`

### App container runtime

In Docker Compose, the app service overrides these with internal DNS values:

- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/feature_flags`
- `REDIS_URL=redis://redis:6379`

This allows the same codebase to work both from host and inside container.

## 3. Where the Connection Is Established in Code

### PostgreSQL

- `src/config/db.ts` creates a `pg.Pool` using `env.DATABASE_URL`.
- Repository methods query this pool.

### Redis

- `src/config/redis.ts` creates an `ioredis` client using `env.REDIS_URL`.
- Repository uses Redis for feature cache keys:
  - `features:all`
  - `features:key:<featureKey>`

## 4. Startup Sequence

1. App starts.
2. `src/server.ts` runs `migrate()`.
3. `src/db/migrate.ts` creates tables if they do not exist and seeds base rows.
4. Server begins listening after migration succeeds.

This ensures DB schema is ready before API requests.

## 5. API/Data Flow

1. Route receives request.
2. Controller calls service.
3. Service calls repository.
4. Repository reads/writes Postgres.
5. Repository reads/writes Redis cache where applicable.

For reads, Redis is checked first; on miss, Postgres is queried and cache is populated.
For writes, Postgres is updated first and related Redis keys are invalidated.

## 6. Test Strategy

Integration tests:

- call `migrate()` once before suite
- reset DB tables before each test
- flush Redis for deterministic cache behavior

This keeps tests isolated and reproducible.

## 7. Key Problem Solved

If host port `5432` is already used by a local PostgreSQL service, host-side tests may hit the wrong DB and fail auth.

Fix applied:

- mapped Docker Postgres to host `5433`
- mapped Docker Redis to host `6380`
- updated host-side env URLs to match

This guarantees host-run tests connect to the intended Docker containers.

## 8. Quick Commands

Start stack:

```bash
docker compose up -d
```

Run tests:

```bash
npm test
```

Check containers:

```bash
docker compose ps
```

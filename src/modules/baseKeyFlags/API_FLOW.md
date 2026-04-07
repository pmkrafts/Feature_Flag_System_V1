# Base Key Flags — API Flow

## Architecture Overview

Every HTTP request passes through the following four layers in strict order:

```
Request → routes.ts → controller.ts → service.ts → repository.ts → Response
```

Each layer has a single responsibility and only talks to the layer directly below it.

---

## Layers in Detail

### 1. routes.ts — Entry Point
- Defines the Express `Router` and all endpoint paths.
- Instantiates `Repository → Service → Controller` (dependency injection by hand).
- Attaches middleware in order: `authMiddleware` › `validateBody(schema)` › `asyncHandler(handler)`.
- `asyncHandler` wraps every handler so any thrown error is forwarded automatically to `errorHandler`.

### 2. controller.ts — HTTP Adapter
- Reads data from `req.params`, `req.body`, and `req.query`.
- Calls exactly one `service` method per handler — no business logic lives here.
- Delegates all success responses to `sendSuccess(res, data, statusCode)`.
- Throws `AppError` only for HTTP-level concerns (e.g., invalid query param type).

### 3. service.ts — Business Logic
- Contains all rules: duplicate-key guard, access evaluation logic, analytics aggregation.
- Never touches `req` or `res`.
- Throws `AppError` (404/409) when a business rule is violated.
- Calls `repository` methods to read and persist data.

### 4. repository.ts — Data Layer
- Holds the in-memory `features` and `usageLogs` arrays (swap for a DB later).
- Exposes plain CRUD methods (`getAllFeatures`, `createFeature`, etc.).
- Maps private `Record` types to public `Entity` types via `toFeatureEntity` / `toUsageLogEntity`.
- Never throws; returns `undefined` when a record is not found.

---

## Endpoint Flow Diagrams

### GET /api/v1/base-key-flags

```
Client
  └─ GET /
       └─ controller.listFeatures()
            └─ service.listFeatures()
                 └─ repository.getAllFeatures()
                      └─ returns BaseKeyFeature[]
```

---

### POST /api/v1/base-key-flags _(auth required)_

```
Client
  └─ POST / { key, displayName, releasedTo }
       ├─ authMiddleware          → 401 if no/invalid Bearer token
       ├─ validateBody(schema)    → 400 if Zod validation fails
       └─ controller.createFeature()
            └─ service.createFeature()
                 ├─ repository.getFeatureByKey()  → 409 if key exists
                 └─ repository.createFeature()    → returns 201 + BaseKeyFeature
```

---

### PATCH /api/v1/base-key-flags/:key/release _(auth required)_

```
Client
  └─ PATCH /:key/release { releasedTo }
       ├─ authMiddleware          → 401 if no/invalid Bearer token
       ├─ validateBody(schema)    → 400 if value not in (none|premium|all)
       └─ controller.updateReleaseTarget()
            └─ service.updateReleaseTarget()
                 └─ repository.updateReleaseTarget()  → 404 if key not found
                      └─ returns updated BaseKeyFeature
```

---

### POST /api/v1/base-key-flags/:key/check

```
Client
  └─ POST /:key/check { userTier }
       ├─ validateBody(schema)    → 400 if userTier not in (free|premium)
       └─ controller.checkAccess()
            └─ service.evaluateAccess()
                 ├─ repository.getFeatureByKey()   → 404 if key not found
                 ├─ evaluates: releasedTo === 'all'
                 │             OR (releasedTo === 'premium' AND userTier === 'premium')
                 ├─ if allowed  → repository.createUsageLog()
                 └─ returns { featureKey, releasedTo, userTier, allowed: boolean }
```

---

### GET /api/v1/base-key-flags/analytics/by-tier

```
Client
  └─ GET /analytics/by-tier
       └─ controller.getUsageByTier()
            └─ service.getUsageByTier()
                 └─ repository.getAllUsageLogs()
                      └─ aggregated by (featureKey + userTier) Map
                           └─ returns UsageByTier[]
```

---

### GET /api/v1/base-key-flags/analytics/popularity?hours=N

```
Client
  └─ GET /analytics/popularity?hours=24
       └─ controller.getFeaturePopularity()
            ├─ validates hours is a positive finite number → 400 if not
            └─ service.getFeaturePopularity(hours)
                 └─ repository.getAllUsageLogs()
                      └─ filters logs within the last N hours
                           └─ returns FeaturePopularity[]
```

---

### GET /api/v1/base-key-flags/analytics/last-seen

```
Client
  └─ GET /analytics/last-seen
       └─ controller.getLastSeen()
            └─ service.getLastSeen()
                 └─ repository.getAllFeatures() + getAllUsageLogs()
                      └─ for each feature, finds the most recent log createdAt
                           └─ returns FeatureLastSeen[]  (null if never accessed)
```

---

## Middleware Order (per route)

| Middleware | Purpose | Applied to |
| --- | --- | --- |
| `authMiddleware` | Validates Bearer JWT | POST /, PATCH /:key/release |
| `validateBody(schema)` | Zod request body validation | POST /, PATCH /:key/release, POST /:key/check |
| `asyncHandler` | Forwards async errors to `errorHandler` | All routes |

---

## Error Propagation

```
service/controller throws AppError(message, statusCode)
    └─ asyncHandler catches it
         └─ forwards to errorHandler middleware
              └─ returns { success: false, error: { message } }
```

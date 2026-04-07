# Base Key Flags — Module Creation Steps

This document captures the exact steps taken to build the `baseKeyFlags` module from scratch, so the same pattern can be repeated for any new feature module.

---

## Prerequisites

- Express + TypeScript project with `@/` path alias configured in `tsconfig.json`.
- Shared utilities available: `AppError`, `sendSuccess`, `asyncHandler`, `authMiddleware`, `validateBody`.
- API router registered in `src/routes/index.ts`.

---

## Step 1 — Define Types and Repository (`repository.ts`)

1. Declare public entity types (`BaseKeyFeature`, `FeatureUsageLog`) and value-union types (`ReleaseTarget`, `UserTier`).
2. Declare internal private record types (`FeatureRecord`, `UsageLogRecord`) that include native `Date` instead of strings.
3. Create the `BaseKeyFlagsRepository` class with two private in-memory arrays: `features` and `usageLogs`.
4. Seed `features` with initial data inside the array declaration.
5. Implement CRUD methods:
   - `getAllFeatures()` — maps records to entities via `toFeatureEntity()`.
   - `getFeatureByKey(key)` — returns `undefined` (not null) when not found.
   - `createFeature(key, displayName, releasedTo)` — assigns auto-incremented `id`.
   - `updateReleaseTarget(key, releasedTo)` — mutates the record in-place, returns `undefined` if missing.
   - `createUsageLog(featureKey, userTier, success)` — appends to `usageLogs`.
   - `getAllUsageLogs()` — maps records to log entities via `toUsageLogEntity()`.
6. Add two private mapper methods (`toFeatureEntity`, `toUsageLogEntity`) to convert `Date` → `ISO string`.

---

## Step 2 — Implement Business Logic (`service.ts`)

1. Import entity types, the repository class, and `AppError`.
2. Define local internal types for method return shapes (`AccessEvaluation`, `UsageByTier`, `FeaturePopularity`, `FeatureLastSeen`).
3. Create `BaseKeyFlagsService` with a `constructor(private readonly repository: BaseKeyFlagsRepository)`.
4. Implement feature management methods:
   - `listFeatures()` — delegates to repository.
   - `getFeatureByKey(key)` — throws `AppError(404)` if not found.
   - `createFeature(key, displayName, releasedTo)` — checks for duplicate key, throws `AppError(409)` if exists.
   - `updateReleaseTarget(key, releasedTo)` — throws `AppError(404)` if not found.
5. Implement access evaluation:
   - `evaluateAccess(featureKey, userTier)` — apply rule: `releasedTo === 'all'` OR `(releasedTo === 'premium' AND userTier === 'premium')`.
   - Write a usage log only when access is granted.
6. Implement analytics methods:
   - `getUsageByTier()` — aggregate logs using a `Map` keyed on `featureKey::userTier`.
   - `getFeaturePopularity(hours)` — filter logs by `createdAt > now - hours * 3600000`.
   - `getLastSeen()` — for each feature, find the latest log `createdAt`, return `null` if never accessed.

---

## Step 3 — Create HTTP Handlers (`controller.ts`)

1. Import `Request`, `Response` from `express`, the service class, `sendSuccess`, and `AppError`.
2. Create `BaseKeyFlagsController` with a `constructor(private readonly service: BaseKeyFlagsService)`.
3. Define each handler as an **arrow method** (not a prototype method) so `this` binding is preserved when passed to `asyncHandler`.
4. Implement one handler per service method:
   - `listFeatures` — reads nothing from `req`, returns `service.listFeatures()`.
   - `getFeatureByKey` — reads `req.params.key`.
   - `createFeature` — reads `req.body.key`, `req.body.displayName`, `req.body.releasedTo`, returns 201.
   - `updateReleaseTarget` — reads `req.params.key` and `req.body.releasedTo`.
   - `checkAccess` — reads `req.params.key` and `req.body.userTier`.
   - `getUsageByTier`, `getLastSeen` — read nothing from `req`.
   - `getFeaturePopularity` — reads `req.query.hours`, converts to number, throws `AppError(400)` if invalid.
5. Wrap every response with `sendSuccess(res, data, statusCode)`.

---

## Step 4 — Define Routes and Wire Dependencies (`routes.ts`)

1. Import `Router` from `express` and `z` from `zod`.
2. Import `Repository`, `Service`, `Controller`, and all shared middleware.
3. Define Zod schemas for each request body:
   - `createFeatureSchema` — `key` (2–64 chars), `displayName` (2–120 chars), `releasedTo` enum with default `"none"`.
   - `updateReleaseSchema` — `releasedTo` enum.
   - `checkAccessSchema` — `userTier` enum.
4. Instantiate the dependency chain once at module load: `new Repository()` → `new Service(repository)` → `new Controller(service)`.
5. Create `export const baseKeyFlagRoutes = Router()`.
6. Register routes in this order (static paths before dynamic `/:key`):
   - `GET /` — no auth, no body validation.
   - `GET /analytics/by-tier` — no auth.
   - `GET /analytics/popularity` — no auth.
   - `GET /analytics/last-seen` — no auth.
   - `GET /:key` — no auth.
   - `POST /` — `authMiddleware`, `validateBody(createFeatureSchema)`.
   - `PATCH /:key/release` — `authMiddleware`, `validateBody(updateReleaseSchema)`.
   - `POST /:key/check` — `validateBody(checkAccessSchema)` only.
7. Wrap every handler in `asyncHandler(controller.method)`.

> **Note:** Register static analytics routes **before** `/:key` so Express does not try to match `"analytics"` as a dynamic key parameter.

---

## Step 5 — Register the Module in the API Router (`src/routes/index.ts`)

1. Import `baseKeyFlagRoutes` from the new module.
2. Register it with `apiRouter.use("/base-key-flags", baseKeyFlagRoutes)`.
3. Add `"/base-key-flags"` to the root metadata endpoint's `endpoints` list.

---

## Step 6 — Write Unit Tests (`tests/unit/baseKeyFlag.service.test.ts`)

1. Import `BaseKeyFlagsRepository`, `BaseKeyFlagsService`, and `AppError`.
2. Instantiate fresh `new BaseKeyFlagsRepository()` and `new BaseKeyFlagsService(repository)` per test (no shared state).
3. Cover these cases:
   - List returns seeded features.
   - Create persists a new feature with the correct fields.
   - Duplicate key creation throws `AppError`.
   - `evaluateAccess` returns `allowed: true` for premium user on a premium feature.
   - `evaluateAccess` returns `allowed: false` for free user on a premium feature.
   - Usage log is recorded after a successful access check.

---

## Step 7 — Write Integration Tests (`tests/integration/baseKeyFlag.test.ts`)

1. Import `request` from `supertest`, the `app`, `jwt`, and `env`.
2. Sign a test JWT: `jwt.sign({ sub: "test-user" }, env.JWT_SECRET)`.
3. Generate a unique feature key with `Date.now()` to avoid collision between test runs.
4. Cover these HTTP scenarios:
   - `GET /` returns 200 with array data.
   - `POST /` without token returns 401.
   - `POST /` with valid token returns 201 with the created feature.
   - `PATCH /:key/release` with valid token updates `releasedTo`.
   - `POST /:key/check` for free tier returns `allowed: false`.
   - `POST /:key/check` for premium tier returns `allowed: true`.
   - `GET /analytics/by-tier` returns 200 with array after access checks above.

---

## Final Module Structure

```
src/modules/baseKeyFlags/
├── repository.ts       — in-memory data layer (types, CRUD, mappers)
├── service.ts          — business logic (access rules, analytics, guards)
├── controller.ts       — HTTP handlers (read req, call service, send response)
├── routes.ts           — Express router, Zod schemas, DI wiring
├── API_FLOW.md         — request flow diagrams per endpoint
└── CREATION_STEPS.md   — this file
```

# Project Architecture and Flow

This document explains how the backend is structured, how a request moves through the app, and how to extend the codebase safely.

## 1) High-Level Overview

This project uses a layered backend architecture:

- Entry layer: bootstraps server and environment
- HTTP layer: Express app, middlewares, and routes
- Module layer: feature-focused folders (example: `sample`)
- Domain/service layer: business logic
- Data/repository layer: persistence logic (currently in-memory)
- Shared utilities: reusable response, error, and async helpers

Current API base path:

- `/api/v1`

## 2) Directory Structure

```text
src/
  app.ts                  # Express app wiring (middlewares + routes + error handling)
  server.ts               # Process entrypoint (starts HTTP server)

  config/
    env.ts                # Environment variable parsing/validation with zod

  middlewares/
    requestLogger.ts      # Logs incoming requests
    auth.ts               # JWT authentication guard
    validate.ts           # Zod request body validation
    notFound.ts           # 404 handler
    errorHandler.ts       # Central error middleware

  routes/
    index.ts              # API v1 router, health route, module router mounting

  modules/
    sample/
      routes.ts           # Feature router + dependency wiring
      controller.ts       # Request/response adapter
      service.ts          # Business logic
      repository.ts       # Data access (in-memory for now)

  utils/
    apiResponse.ts        # Standard success response format
    appError.ts           # Operational error class
    asyncHandler.ts       # Async route wrapper

tests/
  integration/
    app.test.ts
  unit/
    sample.service.test.ts
```

## 3) Runtime Startup Flow

```text
server.ts
  -> imports app from app.ts
  -> reads env.PORT from config/env.ts
  -> starts listening
```

### Startup responsibilities

1. `config/env.ts` loads `.env` values (`dotenv`) and validates them (`zod`).
2. If env validation fails, process exits early.
3. `app.ts` configures middleware pipeline and routes.
4. `server.ts` starts the HTTP server.

## 4) Request Lifecycle Flow

For requests under `/api/v1/...`:

```text
Client Request
  -> requestLogger
  -> cors
  -> express.json
  -> compression
  -> rateLimit
  -> /api/v1 router
      -> route handlers / module routers
  -> notFound (if no route matched)
  -> errorHandler (handles thrown errors)
  -> JSON Response
```

## 5) Feature Module Flow (Sample Module)

The `sample` module demonstrates the preferred module architecture.

```text
Route (modules/sample/routes.ts)
  -> Controller (controller.ts)
    -> Service (service.ts)
      -> Repository (repository.ts)
        -> returns data
      -> business result
    -> sendSuccess(response)
```

### Why this split matters

- Routes: HTTP concerns and middleware composition
- Controller: maps request input to service calls and response output
- Service: business rules and orchestration
- Repository: data access implementation details

This separation keeps business logic testable and reusable.

## 6) Middleware and Error Flow

### Validation flow

- `validateBody(schema)` parses `req.body` with Zod.
- Invalid input throws `AppError` with status `400`.

### Auth flow

- `authMiddleware` expects `Authorization: Bearer <token>`.
- Token is verified with `JWT_SECRET`.
- Invalid/missing token throws `AppError` with status `401`.

### Error flow

```text
Throw AppError -> errorHandler -> status from AppError -> { success: false, error }
Throw unknown  -> errorHandler -> 500 -> { success: false, error: Internal Server Error }
```

## 7) Response Contract

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "message": "..."
  }
}
```

## 8) Testing Strategy

- Unit tests (`tests/unit`): verify isolated business behavior (example: service logic).
- Integration tests (`tests/integration`): verify HTTP endpoints and app wiring via `supertest`.

This gives confidence at both logic and API contract levels.

## 8.1) Commit Quality Strategy

- Commit messages follow Conventional Commits and are validated with `commitlint`.
- Config is defined in `commitlint.config.cjs` and extends `@commitlint/config-conventional`.
- Use `npm run lint:commit` to validate recent commits in the local branch.

## 9) Deployment and Build Flow

### Local development

- `npm run dev`: runs with `ts-node` + `nodemon`
- `npm run lint:commit`: checks commit messages against Conventional Commits rules

### Production build

- `npm run build`: compiles TypeScript and resolves path aliases
- `npm start`: runs compiled output from `dist/`

### Docker

- `Dockerfile` builds app and runs `dist/server.js`
- `docker-compose.yml` maps `3000:3000` and loads `.env`

## 10) How to Add a New Module (Recommended Pattern)

1. Create folder: `src/modules/<feature>/`.
2. Add files: `routes.ts`, `controller.ts`, `service.ts`, `repository.ts`.
3. Instantiate dependencies in `<feature>/routes.ts`:
   - repository -> service -> controller
4. Add route handlers with middleware (`authMiddleware`, `validateBody`, etc.).
5. Mount router in `src/routes/index.ts` under `/api/v1/<feature>`.
6. Add unit and integration tests.

## 11) Architecture Notes and Next Improvements

Current design is intentionally simple and interview-friendly. Common next steps:

- Replace in-memory repositories with database adapters.
- Add dedicated auth module (login/refresh/user roles).
- Add request/response DTO types where needed.
- Add observability (structured logs, metrics, tracing).
- Add OpenAPI/Swagger for API discoverability.

---

If you keep new features aligned with the same Route -> Controller -> Service -> Repository flow, the codebase stays predictable, testable, and easy to scale.

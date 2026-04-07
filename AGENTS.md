---
name: Feature Flag System Agents
description: Custom agents for the Express TypeScript backend Feature Flag System project
---

# Agents for Feature Flag System Backend

This document describes custom agents available for working with this Express.js + TypeScript backend project. Each agent is optimized for specific development workflows.

## Mandatory Context Bootstrap (Read First)

Before any implementation, debugging, refactor, or test work, the agent must read these files to build project context:

1. `PROJECT_ARCHITECTURE.md`
2. `DOCKER_APP_CONNECTION.md`
3. `RUN_MODES.md`
4. `src/modules/baseKeyFlags/API_FLOW.md`
5. `src/modules/baseKeyFlags/CREATION_STEPS.md`
6. `swagger.yaml`

If any of these files are updated during a task, re-read the changed file before continuing.
Do not skip this step.

## Available Agents

### 1. **Module Architect**
**Purpose**: Create and structure new feature modules following the established pattern.

**When to use**:
- Adding a new feature module (e.g., `flags`, `users`, `analytics`)
- Implementing the Route → Controller → Service → Repository pattern
- Setting up dependency injection for a new feature

**What it does**:
- Generates boilerplate scaffolding for routes, controller, service, and repository files
- Sets up proper TypeScript types and error handling
- Registers the module in the API router
- Creates corresponding unit and integration tests

**Example request**: "Create a new feature flags module with CRUD operations"

---

### 2. **API Validator**
**Purpose**: Validate and extend API request/response contracts using Zod.

**When to use**:
- Adding input validation schemas to routes
- Ensuring request body format compliance
- Documenting API contract changes
- Fixing validation errors in existing endpoints

**What it does**:
- Analyzes current validation schemas
- Creates or updates Zod schemas for request bodies
- Applies `validateBody` middleware to routes
- Updates tests to cover validation paths

**Example request**: "Add validation schema for feature flag creation endpoint"

---

### 3. **Test Engineer**
**Purpose**: Write comprehensive unit and integration tests.

**When to use**:
- Increasing test coverage for a module
- Writing integration tests for new endpoints
- Setting up mocks for repository/service layers
- Validating error handling paths

**What it does**:
- Identifies untested code paths in services and controllers
- Generates unit tests for business logic (service layer)
- Generates integration tests for HTTP endpoints
- Sets up Jest mocks and fixtures
- Validates tests pass with `npm run test`

**Example request**: "Write comprehensive tests for the flags service"

---

### 4. **Middleware Specialist**
**Purpose**: Create, update, or debug authentication, validation, and error handling middleware.

**When to use**:
- Implementing custom authentication checks
- Creating role-based access control (RBAC)
- Extending error handling for specific scenarios
- Adding request preprocessing steps

**What it does**:
- Reviews existing middleware pipeline
- Creates new middleware handlers
- Integrates middleware into routes
- Ensures error propagation to errorHandler

**Example request**: "Add authorization middleware to check user permissions for flag updates"

---

### 5. **Deployment Specialist**
**Purpose**: Set up and troubleshoot Docker, environment config, and deployment.

**When to use**:
- Configuring environment variables for different stages (dev, test, prod)
- Updating Dockerfile for new dependencies
- Setting up docker-compose for multi-service deployment
- Validating build and runtime configurations

**What it does**:
- Reviews and updates environment validation (env.ts)
- Manages Dockerfile and docker-compose.yml
- Ensures all secrets and configs are externalized
- Validates containerized app builds and runs

**Example request**: "Set up production environment variables and rebuild Docker image"

---

### 6. **Debugging Detective**
**Purpose**: Troubleshoot runtime issues, type errors, and test failures.

**When to use**:
- Resolving TypeScript compilation errors
- Fixing failing tests
- Debugging async/await issues
- Tracing error propagation through middleware

**What it does**:
- Analyzes error messages and stack traces
- Locates source of type mismatches
- Identifies missing middleware or router registration
- Traces request lifecycle to find bugs

**Example request**: "Why is the auth middleware throwing 401 errors on valid tokens?"

---

### 7. **Architecture Reviewer**
**Purpose**: Review code structure, adherence to patterns, and scalability.

**When to use**:
- Evaluating a new module for consistency
- Refactoring to align with layered architecture
- Assessing if codebase can scale for new requirements
- Suggesting improvements to request flow

**What it does**:
- Audits modules for Route → Controller → Service → Repository separation
- Identifies tight coupling or circular dependencies
- Proposes refactoring for better testability
- Documents architecture decisions for maintainability

**Example request**: "Review the new admin module for architecture alignment"

---

### 8. **Performance Optimizer**
**Purpose**: Identify and fix performance bottlenecks.

**When to use**:
- Response times are slow
- Database queries are inefficient (when DB is integrated)
- Memory usage is high under load
- Middleware pipeline is redundant

**What it does**:
- Profiles request/response timing
- Analyzes expensive operations in services
- Recommends caching strategies
- Suggests middleware optimization

**Example request**: "Optimize the flag lookup endpoint for high throughput"

---

## How to Invoke

Type `/` in the chat and select the agent you need, or mention the agent name in your request:

```
"Use the Module Architect to create a users module"
"Module Architect: Create a feature flags module with CRUD operations"
```

---

## Project Context

**Stack**: Express.js + TypeScript + Zod + JWT + Jest + Supertest

**Key Patterns**:
- Layered architecture (Route → Controller → Service → Repository)
- Middleware-based request/response pipeline
- Centralized error handling with `AppError`
- Async wrapper for safe error propagation
- In-memory repositories (ready for DB swap)

**Key Files**:
- `src/app.ts` — Middleware pipeline and error handler
- `src/config/env.ts` — Environment validation
- `src/modules/*/routes.ts` — Feature entry points
- `src/utils/` — Shared response, error, and async helpers

**Testing**:
- Unit: `tests/unit/` — Isolated service logic
- Integration: `tests/integration/` — HTTP endpoints with supertest

**API Version**: `/api/v1`

---

## Quick Reference: Architecture Decision Matrix

| Need | Best Agent | Why |
|------|-----------|-----|
| New feature module | Module Architect | Generates full scaffold with pattern alignment |
| Add request validation | API Validator | Zod schemas and middleware integration |
| Test coverage | Test Engineer | Jest setup and comprehensive test generation |
| Custom auth logic | Middleware Specialist | Auth middleware and RBAC patterns |
| Docker or env issues | Deployment Specialist | Config management and containerization |
| Build errors or bugs | Debugging Detective | Error tracing and root cause analysis |
| Code review | Architecture Reviewer | Pattern enforcement and scalability |
| Slow endpoints | Performance Optimizer | Bottleneck identification and tuning |

---

## Project Links

- **Architecture**: [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
- **Creation Guide**: [PROJECT_CREATION_GUIDE.md](PROJECT_CREATION_GUIDE.md)
- **Quick Start**: [README.md](README.md)

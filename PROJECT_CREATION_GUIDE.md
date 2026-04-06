# How to Create This Express + TypeScript Backend Project (Step by Step)

This guide explains how to recreate this project from scratch, including commands and why each step exists.

## 0) Prerequisites

Install these first:

- Node.js 20+
- npm 10+
- Docker Desktop (optional, for container run)
- Git (optional, recommended)

Check versions:

```bash
node -v
npm -v
docker -v
```

## 1) Create and initialize the project

Why: This creates the project folder and initializes package.json.

```bash
mkdir express-ts-backend
cd express-ts-backend
npm init -y
```

## 2) Install runtime dependencies

Why: These packages are needed when the app runs.

```bash
npm install express cors compression dotenv express-rate-limit jsonwebtoken zod
```

## 3) Install dev dependencies

Why: These packages are only for development, testing, linting, and TypeScript build.

```bash
npm install -D typescript ts-node tsconfig-paths tsc-alias nodemon
npm install -D jest ts-jest supertest
npm install -D @types/node @types/express @types/jest @types/supertest @types/jsonwebtoken @types/cors @types/compression
npm install -D eslint @eslint/js @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
npm install -D prettier
npm install -D @commitlint/cli @commitlint/config-conventional
```

## 4) Add scripts to package.json

Why: Scripts standardize how the team runs dev, test, build, lint.

Replace scripts in package.json with:

```json
{
  "scripts": {
    "dev": "nodemon --watch src --ext ts --exec ts-node -r tsconfig-paths/register src/server.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/server.js",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "lint:commit": "commitlint --from=HEAD~1 --to=HEAD --verbose",
    "lint:commit:msg": "commitlint --edit",
    "format": "prettier --write .",
    "test": "jest --runInBand",
    "test:unit": "jest tests/unit --runInBand",
    "test:integration": "jest tests/integration --runInBand"
  }
}
```

## 4.1) Configure Commitlint

Why: Enforces Conventional Commits so history stays readable and automations can parse commit intent.

Create commitlint.config.cjs:

```js
module.exports = {
  extends: ["@commitlint/config-conventional"]
};
```

## 5) Configure TypeScript

Why: Defines strict compile rules, output folder, and path alias support.

Create tsconfig.json:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "src",
    "outDir": "dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

Create tsconfig.test.json:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "types": ["jest", "node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "tests"]
}
```

## 6) Configure ESLint (flat config for ESLint v9)

Why: Lint rules enforce code quality and consistency.

Create eslint.config.cjs:

```js
const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"]
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2022
      },
      globals: {
        console: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
        __dirname: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        jest: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "argsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  prettier
];
```

## 7) Configure Jest

Why: Enables unit and integration tests with TypeScript support.

Create jest.config.ts:

```ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"]
};

export default config;
```

## 8) Create folder structure

Why: Keeps architecture modular and scalable.

PowerShell:

```powershell
New-Item -ItemType Directory -Force src, src/config, src/middlewares, src/modules, src/modules/sample, src/routes, src/utils, tests, tests/unit, tests/integration
```

Bash:

```bash
mkdir -p src/config src/middlewares src/modules/sample src/routes src/utils tests/unit tests/integration
```

## 9) Add environment configuration

Why: Centralized and validated runtime configuration.

Create .env:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your_super_secret_key_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

Create src/config/env.ts:

```ts
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(8),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
```

## 10) Add core utilities

Why: Standard response, errors, and async handling reduce repetition.

Create src/utils/apiResponse.ts:

```ts
import { Response } from "express";

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): Response => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};
```

Create src/utils/appError.ts:

```ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

Create src/utils/asyncHandler.ts:

```ts
import { NextFunction, Request, Response } from "express";

export const asyncHandler = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<unknown> | unknown
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

## 11) Add middlewares

Why: Shared request concerns are handled consistently.

Create src/middlewares/requestLogger.ts:

```ts
import { NextFunction, Request, Response } from "express";

export const requestLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
};
```

Create src/middlewares/validate.ts:

```ts
import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { AppError } from "@/utils/appError";

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(", ");
      throw new AppError(message || "Validation failed", 400);
    }

    req.body = result.data;
    next();
  };
};
```

Create src/middlewares/auth.ts:

```ts
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
import { AppError } from "@/utils/appError";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: String(decoded.sub ?? ""),
      role: typeof decoded.role === "string" ? decoded.role : undefined
    };

    next();
  } catch (_error) {
    throw new AppError("Invalid token", 401);
  }
};
```

Create src/middlewares/notFound.ts:

```ts
import { Request, Response } from "express";

export const notFound = (_req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    error: {
      message: "Route not found"
    }
  });
};
```

Create src/middlewares/errorHandler.ts:

```ts
import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/appError";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message
      }
    });
  }

  console.error("Unhandled error", err);

  return res.status(500).json({
    success: false,
    error: {
      message: "Internal Server Error"
    }
  });
};
```

## 12) Add app entrypoint and API router

Why: This is the top-level HTTP pipeline and versioned API mount.

Create src/routes/index.ts:

```ts
import { Router } from "express";
import { sampleRoutes } from "@/modules/sample/routes";
import { sendSuccess } from "@/utils/apiResponse";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  return sendSuccess(res, {
    message: "API v1 is running",
    endpoints: ["/health", "/sample"]
  });
});

apiRouter.get("/health", (_req, res) => {
  return sendSuccess(res, { status: "ok" });
});

apiRouter.use("/sample", sampleRoutes);
```

Create src/app.ts:

```ts
import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { errorHandler } from "@/middlewares/errorHandler";
import { notFound } from "@/middlewares/notFound";
import { requestLogger } from "@/middlewares/requestLogger";
import { apiRouter } from "@/routes";

export const app = express();

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use(compression());
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX
  })
);

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler);
```

Create src/server.ts:

```ts
import { app } from "@/app";
import { env } from "@/config/env";

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
```

## 13) Add sample module (reference feature)

Why: Demonstrates the Route -> Controller -> Service -> Repository pattern.

Create src/modules/sample/repository.ts:

```ts
export type SampleEntity = {
  id: number;
  name: string;
};

export class SampleRepository {
  private readonly items: SampleEntity[] = [
    { id: 1, name: "Alpha" },
    { id: 2, name: "Beta" }
  ];

  getAll(): SampleEntity[] {
    return this.items;
  }

  create(name: string): SampleEntity {
    const nextId = this.items.length + 1;
    const item = { id: nextId, name };
    this.items.push(item);
    return item;
  }
}
```

Create src/modules/sample/service.ts:

```ts
import { SampleEntity, SampleRepository } from "@/modules/sample/repository";

export class SampleService {
  constructor(private readonly sampleRepository: SampleRepository) {}

  listSamples(): SampleEntity[] {
    return this.sampleRepository.getAll();
  }

  createSample(name: string): SampleEntity {
    return this.sampleRepository.create(name);
  }
}
```

Create src/modules/sample/controller.ts:

```ts
import { Request, Response } from "express";
import { SampleService } from "@/modules/sample/service";
import { sendSuccess } from "@/utils/apiResponse";

export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  getSamples = (_req: Request, res: Response): Response => {
    const data = this.sampleService.listSamples();
    return sendSuccess(res, data);
  };

  addSample = (req: Request, res: Response): Response => {
    const data = this.sampleService.createSample(req.body.name);
    return sendSuccess(res, data, 201);
  };
}
```

Create src/modules/sample/routes.ts:

```ts
import { Router } from "express";
import { z } from "zod";
import { SampleRepository } from "@/modules/sample/repository";
import { SampleService } from "@/modules/sample/service";
import { SampleController } from "@/modules/sample/controller";
import { asyncHandler } from "@/utils/asyncHandler";
import { authMiddleware } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validate";

const createSampleSchema = z.object({
  name: z.string().min(2, "name must be at least 2 characters")
});

const sampleRepository = new SampleRepository();
const sampleService = new SampleService(sampleRepository);
const sampleController = new SampleController(sampleService);

export const sampleRoutes = Router();

sampleRoutes.get("/", asyncHandler(sampleController.getSamples));
sampleRoutes.post(
  "/",
  authMiddleware,
  validateBody(createSampleSchema),
  asyncHandler(sampleController.addSample)
);
```

## 14) Add tests

Why: Unit tests validate business logic; integration tests validate API behavior.

Create tests/unit/sample.service.test.ts:

```ts
import { SampleRepository } from "@/modules/sample/repository";
import { SampleService } from "@/modules/sample/service";

describe("SampleService", () => {
  it("returns seeded samples", () => {
    const service = new SampleService(new SampleRepository());

    const result = service.listSamples();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
  });

  it("creates a new sample", () => {
    const service = new SampleService(new SampleRepository());

    const created = service.createSample("Gamma");

    expect(created.name).toBe("Gamma");
    expect(created.id).toBeGreaterThan(0);
  });
});
```

Create tests/integration/app.test.ts:

```ts
import request from "supertest";
import { app } from "@/app";

describe("App routes", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("returns samples list", async () => {
    const response = await request(app).get("/api/v1/sample");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
```

## 15) Run and validate locally

Why: Confirms the project compiles, tests pass, and API works.

```bash
npm run lint
npm run test
npm run dev
```

Quick API checks (new terminal):

```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/sample
```

Expected health response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## 16) Add Docker support

Why: Provides reproducible runtime across environments.

Create Dockerfile:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

Create docker-compose.yml:

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
```

Run containerized app:

```bash
docker-compose up --build
```

## 17) Recommended final checks before first commit

```bash
npm run lint
npm run test
npm run build
npm run lint:commit
```

Commit message examples that pass:

```text
feat: add sample create endpoint
fix: handle missing authorization header
docs: update setup guide for commitlint
```

If everything is green, initialize git (if not already done):

```bash
git init
git add .
git commit -m "Initialize Express TypeScript backend boilerplate"
```

## 18) What you have after completing this guide

- Versioned API at /api/v1
- Strict TypeScript setup
- ESLint v9 flat config
- Request logging, auth, validation, error handling
- Layered module architecture
- Unit + integration tests
- Dockerized deployment path

This is a clean base for adding auth modules, database adapters, and production-grade features.

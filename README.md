# Express.js + TypeScript Backend (Docker Ready)

Simple production-style backend architecture for SDE1-SDE2 level projects.

## Quick Start

1. Install dependencies

npm install

2. Start development server

npm run dev

3. Run tests

npm run test

4. Open API base URL

http://localhost:3000/api/v1

## Documentation

- Architecture flow and structure: [PROJECT_ARCHITECTURE.md](PROJECT_ARCHITECTURE.md)
- Full step-by-step project creation guide: [PROJECT_CREATION_GUIDE.md](PROJECT_CREATION_GUIDE.md)

## Stack

- Express.js
- TypeScript (strict)
- Zod validation
- JWT auth middleware placeholder
- Jest + Supertest
- Docker + docker-compose

## Project Structure

src/
|- modules/
|  |- sample/
|     |- controller.ts
|     |- service.ts
|     |- repository.ts
|     |- routes.ts
|- config/
|- middlewares/
|- utils/
|- routes/
|- app.ts
|- server.ts

tests/
|- unit/
|- integration/

## API Base URL

http://localhost:3000/api/v1

## Setup

1. Install dependencies

npm install

2. Run in development

npm run dev

3. Build and run

npm run build
npm start

## Docker

Build and run with Docker Compose:

docker-compose up --build

## Sample Routes

- GET /api/v1/health
- GET /api/v1/sample
- POST /api/v1/sample (Protected)

POST body:

{
  "name": "Gamma"
}

Authorization header example:

Bearer <jwt_token>

## Response format

{
  "success": true,
  "data": {}
}

## Notes

- Replace JWT logic with full auth module when ready.
- Replace in-memory repository with a DB implementation.
- You can add Swagger later for API docs.

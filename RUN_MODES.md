# Run Modes (Local and Docker)

This app supports two run methods using npm commands.

## 1. Run Locally (Terminal)

Use this when you want to run Node directly on your machine.

```bash
npm run dev:local
```

What it does:
- Starts Docker dependency containers (`postgres`, `redis`) first
- Runs the app with nodemon + ts-node
- Uses your local terminal process
- Reads environment values from `.env`

Default app URL:
- `http://localhost:3000`

## 2. Run with Docker

Use this when you want app + postgres + redis in containers.

Start containers:

```bash
npm run dev:docker
```

View app logs:

```bash
npm run dev:docker:logs
```

Stop containers:

```bash
npm run dev:docker:down
```

Stop only local dependencies (postgres and redis):

```bash
npm run deps:down
```

What it does:
- Starts `app`, `postgres`, and `redis` through Docker Compose
- App uses container DNS names (`postgres`, `redis`) internally
- Exposes app on `http://localhost:3000`

## 3. If the method was already present

Yes, local run already existed as:

```bash
npm run dev
```

Now you can use either:
- `npm run dev` or `npm run dev:local` for local mode
- `npm run dev:docker` for Docker mode

## 4. Recommended Usage

- Use `dev:local` for fast code iteration.
- Use `dev:docker` for environment parity with containerized services.

# Pr

Ship prompts without redeploys.

Pr is an open-source prompt infrastructure platform for managing production prompts outside application code. It gives teams a control plane to create, version, promote, render, and observe prompts at runtime without shipping a new application deployment for every prompt change.

Teams can use Pr to update live prompts safely, validate runtime variables, expose prompts to applications through API keys, and review execution history with inputs, outputs, latency, caller, and version metadata.

## Core Capabilities

### Prompt Registry

- Organize prompts by project/workspace.
- Create immutable prompt versions with template variables.
- Promote, rollback, and tag versions for environments like `production`, `staging`, and `canary`.

### Runtime Delivery

- Fetch or render the active prompt version from another application.
- Use API keys for application access.
- Validate runtime variables with JSON Schema before rendering.

### Admin Dashboard

- Manage projects, prompts, versions, API keys, runtime rendering, and execution history from a Next.js console.

## Tech Stack

- TypeScript
- Fastify
- Prisma
- PostgreSQL
- Next.js
- React
- Docker Compose

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a root `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prompt_registry"
JWT_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 3. Start Postgres

```bash
docker compose up -d
```

### 4. Sync Prisma

```bash
npm run generate --workspace @pr/database
npm run db:push --workspace @pr/database
```

### 5. Run Locally

```bash
npm run dev:api
npm run dev:web
```

Open:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Health: `http://localhost:3001/health`

## Repository Structure

```txt
apps/
  api/        Fastify API
  web/        Next.js dashboard

packages/
  database/   Prisma schema and client
  shared/     Shared prompt/schema utilities
```

## Current Scope

Pr focuses on core prompt infrastructure: registry, versioning, runtime delivery, API keys, schema validation, and execution history.

## Upcoming Features

- Tool registry
- MCP server
- Team RBAC
- Multi-provider routing
- Prompt playground
- Evaluations
- Observability

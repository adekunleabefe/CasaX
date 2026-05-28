# CasaX

CasaX is a SaaS-first property operations and occupancy platform. This repository keeps
three frontend applications separate from the shared NestJS API:

| Application                                         | Directory        | Local URL                      | Production host  |
| --------------------------------------------------- | ---------------- | ------------------------------ | ---------------- |
| Public website and verified vacancy discovery       | `frontend/web`   | `http://localhost:3000`        | `casax.ng`       |
| Landlord, caretaker, applicant and tenant workspace | `frontend/app`   | `http://localhost:3001`        | `app.casax.ng`   |
| Internal platform operations                        | `frontend/admin` | `http://localhost:3002`        | `admin.casax.ng` |
| NestJS API                                          | `backend`        | `http://localhost:4000/api/v1` | `api.casax.ng`   |

## Prerequisites

- Node.js 20.19 or later
- pnpm 10.12.1
- PostgreSQL 15 or later

## Frontend

```bash
cd frontend
corepack enable
corepack prepare pnpm@10.12.1 --activate
pnpm install
cp web/.env.example web/.env.local
cp app/.env.example app/.env.local
cp admin/.env.example admin/.env.local
pnpm dev:web
pnpm dev:app
pnpm dev:admin
```

Run each `dev:*` command in its own terminal. To run all frontend applications:

```bash
cd frontend
pnpm dev
```

## Backend

Create a PostgreSQL database named `casax`, then configure the API:

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

Swagger documentation is served at `http://localhost:4000/api/docs`.

## Validation

```bash
cd frontend
pnpm lint
pnpm typecheck
pnpm build

cd ../backend
npm run lint
npm run typecheck
npm run build
```

## Authentication Foundation

The API exposes `/api/v1/auth/register`, `/login`, `/refresh`, `/logout`, and `/me`.
Self-registration is limited to applicants and landlords. A user only becomes a tenant
through an approved application, confirmed payment, unit assignment, and tenancy creation.

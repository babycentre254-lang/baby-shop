# Baby Shop

Full-stack e-commerce platform for baby products.

## Structure

- `apps/api` — NestJS backend (MongoDB, JWT auth, M-Pesa/Stripe)
- `apps/web` — Next.js 15 frontend (storefront + admin)
- `packages/shared` — Shared Zod schemas & TypeScript types

## Quick Start

```bash
docker compose up -d        # start MongoDB + Redis
npm install                 # install all workspaces
cp apps/api/.env.example apps/api/.env
npm run dev:api             # API on http://localhost:4000
# Ecommerce Bordadeiras

Next.js 15 + React 19 + Prisma + MySQL 8 + Tailwind CSS 4 + shadcn/ui.

## Getting started

Passo a passo completo em português: **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)**.

## Deploy em produção (VPS)

Guia Hostinger + EasyPanel + Docker: **[docs/VPS_SETUP.md](docs/VPS_SETUP.md)** · variáveis: **[docs/ENV_REFERENCE.md](docs/ENV_REFERENCE.md)** · `env.production.example` · `docker-compose.prod.yml`.

```bash
cp env.example .env
# Edite DATABASE_URL e AUTH_SECRET

npm install
npm run db:push
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> **Windows + OneDrive:** Se `npm install` falhar com `ENOTEMPTY` / `EPERM` / `TAR_ENTRY_ERROR`, pause a sincronização desta pasta ou clone o repositório fora do OneDrive. Detalhes em `docs/GETTING_STARTED.md`.

## Database setup

### Requirements

- MySQL 8.x (local Docker, PlanetScale, or managed MySQL)
- Node.js 20+

### 1. Configure connection

Copy `env.example` to `.env` and set:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/bordadeiras"
```

Create the database if it does not exist:

```sql
CREATE DATABASE bordadeiras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Apply schema

**Development (fast iteration):**

```bash
npm run db:push
```

**Production / versioned migrations:**

```bash
npm run db:migrate
```

This runs `prisma migrate dev` and applies SQL under `prisma/migrations/`.

### 3. Generate client & seed

```bash
npm run db:generate
npm run db:seed
```

Seed creates:

- Admin user (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, defaults in `env.example`)
- Categories, products with `ProductImage` rows, coupon, blog posts, email templates, settings

### 4. Inspect data

```bash
npm run db:studio
```

### Scripts reference

| Script        | Description                          |
|---------------|--------------------------------------|
| `db:push`     | Sync schema to DB (no migration file) |
| `db:migrate`  | Create/apply Prisma migrations         |
| `db:seed`     | Run `prisma/seed.ts`                 |
| `db:studio`   | Prisma Studio GUI                    |
| `db:generate` | Regenerate Prisma Client             |

## Project structure

```
src/
  app/          # App Router pages & API routes
  actions/      # Server actions
  components/   # UI + providers
  lib/          # prisma, auth, utilities
  stores/       # Zustand (cart)
  types/        # Shared TypeScript types
prisma/
  schema.prisma
  seed.ts
  migrations/
```

## Foundation stack

- **Fonts:** Geist, Inter (body), Manrope & Outfit (display) via `next/font`
- **State:** Zustand cart (`src/stores/cart-store.ts`), TanStack Query (`QueryProvider`)
- **UI:** shadcn-style primitives under `src/components/ui`
- **Auth middleware:** `/admin/*` (admin), `/conta` e `/pedidos` (usuário logado); checkout permite visitante nas etapas seguintes

## Default admin (after seed)

- Email: `admin@bordadeiras.com.br`
- Password: `Admin@123456`

Change via `ADMIN_EMAIL` and `ADMIN_PASSWORD` before seeding.

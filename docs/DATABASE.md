# Database (Supabase)

This project no longer uses Prisma. All server-side data access goes through `@supabase/supabase-js` with the service role key.

## Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Schema

SQL migrations live in `supabase/migrations/`. PostgREST table names are PascalCase (`"User"`, `"Product"`, `"Order"`, etc.).

The former Prisma schema is archived at `docs/archive/prisma-schema.prisma` for reference only.

## Types

Application types and enums are in `src/lib/types/database.ts`.

## Data layer

- `src/lib/supabase/db.ts` — `getDb()`, `TABLES`, `newId()`, user helpers
- `src/lib/data/*.ts` — storefront reads
- Server actions / API routes use `getDb()` directly

## Seed (catálogo vazio)

Com `.env.local` configurado (service_role):

```bash
npm run db:seed
```

Insere 3 categorias, 7 produtos com imagens e usuário admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

A loja **não** usa mais dados mock quando o Supabase está online — banco vazio = vitrine vazia até rodar o seed.

# MySQL Prisma migrations (archived)

These folders are the **historical MySQL** `prisma migrate` SQL from before the Supabase cutover. They are **not** run against PostgreSQL.

| Folder | Equivalent on Supabase |
|--------|-------------------------|
| `20250601170000_foundation` | `supabase/migrations/20250601170000_foundation.sql` |
| `20250602180000_storefront_banner` | `supabase/migrations/20250602180000_storefront_banner.sql` |
| `20250602190000_storefront_trust_item` | `supabase/migrations/20250602190000_storefront_trust_item.sql` |

RLS (`20250603120000_rls_baseline.sql`) exists only under `supabase/migrations/`.

## Active Prisma migration track (PostgreSQL)

- `../20250603130000_postgresql_baseline` — no-op baseline; records Prisma history after Supabase DDL is applied.
- After `DATABASE_URL` points at Supabase and `supabase db push` (or equivalent) has run:

  ```bash
  npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline
  ```

Do **not** run `prisma migrate dev` on production against an empty `_prisma_migrations` expecting the archived SQL to apply.

## Fresh environments

1. Apply `supabase/migrations/*.sql` in order (or `supabase db push`).
2. Set `DATABASE_URL` to Postgres (direct URL for migrate; pooler URL optional for app with `?pgbouncer=true`).
3. `npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline`
4. `npx --yes prisma@6 generate`

Future schema changes: add SQL under `supabase/migrations/` **or** use `prisma migrate dev` once the baseline is resolved (pick one source of truth per change).

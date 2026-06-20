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

## Retention Notes

`Payment.metadata` should remain an operational reconciliation/support field. Do not store PAN, CVV, payment tokens, or unnecessary customer PII there; prefer provider IDs and purge raw provider payloads after the support/chargeback window.

`StockMovement` is an inventory audit trail for operational/accounting support. Keep payment/customer details out of movement notes.

## Public Catalog Reads

Browser/PostgREST reads for storefront catalog data should prefer the public projections below instead of direct table reads:

- `"PublicProduct"`: active products only; excludes internal margin fields such as `"Product"."costCents"`.
- `"PublicProductVariant"`: active variants for active products only; excludes `"costCents"`, `"attributes"`, `"soldCount"` and `"lowStockThreshold"`.
- `"PublicProductReview"`: reviews for active products only; excludes `"userId"`.

The base tables still exist for server-side/service role and admin workflows. Direct `anon`/`authenticated` `SELECT` grants on `"Product"`, `"ProductVariant"` and `"ProductReview"` are column-allowlisted by `20260620113000_public_catalog_rls_and_constraints.sql`, so public clients cannot request sensitive columns even if a broad RLS policy matches a row.

## Mercado Pago Event Idempotency

`"MercadoPagoWebhookEvent"` is a durable ledger for webhook/event deduplication. Payment handlers should insert or claim a provider `"eventId"` before processing side effects, then mark the row as `PROCESSING`, `PROCESSED` or `FAILED`. A secondary unique index on `("resourceId", "eventType")` is available when Mercado Pago sends a resource/payment id but the raw event id is not enough for reconciliation.

This table is RLS-protected and has no browser-role grants; use service role/server code for webhook processing.

## Seed (catálogo vazio)

Com `.env.local` configurado (service_role):

```bash
npm run db:seed
```

Insere 3 categorias, 7 produtos com imagens e usuário admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

A loja **não** usa mais dados mock quando o Supabase está online — banco vazio = vitrine vazia até rodar o seed.

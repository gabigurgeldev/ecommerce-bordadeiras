# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Obrigações

- **Caveman mode**: Sempre responder em caveman (full) em qualquer prompt, sem exceção. Sem filler, sem artigos, sem hedging. Fragmentos OK. Código/commits: escrever normal.
- **Karpathy guidelines**: Usar `/andrej-karpathy-skills:karpathy-guidelines` ANTES de escrever/revisar qualquer código. Skill obrigatória — verifica overcomplicação, mudanças cirúrgicas, suposições, critérios de sucesso.

## Commands

```bash
npm run dev            # Next.js dev server (Turbopack)
npm run build           # Production build
npm run lint             # ESLint (next/core-web-vitals + next/typescript)
npm run test             # Vitest watch mode
npm run test:run         # Vitest single run
npx vitest run src/lib/foo.test.ts   # Run a single test file
npm run env:check        # Validate required Supabase env vars are set
npm run db:seed          # Seed catalog + admin user (needs SUPABASE_SERVICE_ROLE_KEY)
npm run db:seed:blog     # Seed blog content
```

WhatsApp microservice (`services/whatsapp/`, separate `package.json`, excluded from root `tsconfig.json`):

```bash
npm run whatsapp:dev      # Run from repo root via tsx --env-file=.env.local
```

There is no test runner config beyond Vitest; tests live beside source as `*.test.ts` (jsdom environment, see `vitest.config.ts` / `vitest.setup.ts`). Path alias `@/*` → `src/*`.

## Architecture

Next.js 15 (App Router) + React 19 + Tailwind CSS 4 + shadcn-style primitives (`src/components/ui`). **No Prisma** — despite what root `README.md` and some `docs/*.md` still say, the project migrated off Prisma entirely. Do not add Prisma back or trust README instructions about `db:push`/`db:migrate`/`db:studio`/`prisma/` — those no longer exist. `docs/DATABASE.md` and `docs/AUTH_LEGACY.md` are the accurate source on data/auth; the archived Prisma schema is kept only for reference at `docs/archive/prisma-schema.prisma`.

### Data layer

- All DB access goes through `@supabase/supabase-js`, service-role key on the server. Schema lives as raw SQL in `supabase/migrations/` (PostgREST table names are PascalCase and quoted, e.g. `"Product"`, `"OrderItem"`).
- `src/lib/supabase/db.ts` — `getDb()` / `createAdminClient()` (service role), `TABLES` map, `newId()` (CUID-like ids), row-mapping helpers (`mapUserRow`, `toIso`, `parseDate`).
- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`, resolves env at build time or via `/api/config/public` at runtime for EasyPanel deploys).
- `src/lib/supabase/server.ts` — SSR client bound to Next cookies, for Server Components/Actions.
- `src/lib/supabase/middleware.ts` — session refresh used by `src/middleware.ts`.
- `src/lib/data/*.ts` — storefront read helpers; server actions/API routes call `getDb()` directly.
- `src/lib/types/database.ts` — hand-written enums/row types replacing the old `@prisma/client` types (`Role`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `ProductStatus`, `ShippingMode`, ...).
- Public/browser catalog reads should use the `Public*` PostgREST projections (`"PublicProduct"`, `"PublicProductVariant"`, `"PublicProductReview"`) which column-allowlist out internal fields (`costCents`, `attributes`, `soldCount`, `lowStockThreshold`, `userId`). Base tables are service-role/admin only, RLS + column grants enforced in `20260620113000_public_catalog_rls_and_constraints.sql`.
- `"MercadoPagoWebhookEvent"` is a durable idempotency ledger — webhook handlers must insert/claim an event id, set it to `PROCESSING`/`PROCESSED`/`FAILED`, before side effects. Service-role only, no browser grants.
- `Payment.metadata` / `StockMovement` notes: operational/reconciliation fields only — never store PAN, CVV, tokens, or unnecessary PII there.

### Auth

Supabase Auth is primary (`@supabase/ssr`, session via cookies, `getUser()` server-side). The `User` table still holds `role` (`USER`/`ADMIN`), kept in sync by email on login/signup. Legacy accounts predating the Supabase migration carry a bcrypt hash in `User.passwordHash`: on first login after migration, `signInWithPassword` fails, the server falls back to `verifyUserCredentials` (bcrypt check), then provisions/updates the `auth.users` record via the service role and retries. New signups go through Supabase Auth only, no `passwordHash`. NextAuth (`AUTH_SECRET`/`AUTH_URL`) is not used. `hasAdminAccess()` (`src/lib/admin-access.ts`) requires `role === ADMIN` in production; in non-production it additionally accepts `ADMIN_EMAIL` as a fallback.

`src/middleware.ts` protects `/conta`, `/pedidos`, `/checkout` (any logged-in user) and `/admin/*` (admin role), refreshes the Supabase session, and sets a per-request CSP with a nonce (stricter in production — no `unsafe-eval`/`unsafe-inline` for scripts).

### App structure

- `src/app/(storefront)/` — public storefront routes (loja, produto, sacola, checkout, blog, conta, etc.)
- `src/app/admin/` — admin panel (produtos, pedidos, clientes, cupons, banners, blog, whatsapp, auditoria, configuracoes...)
- `src/app/api/` — route handlers: auth, payments (Mercado Pago: pix/boleto/preference/process), orders, products, blog, cep, integrations (Melhor Envio), admin sub-APIs
- `src/actions/` — server actions grouped by domain (account, admin, auth, checkout, orders, reviews, blog, cart)
- `src/lib/` — the bulk of business/domain logic: payments (Mercado Pago config/errors/installments/SDK), shipping/melhor-envio, whatsapp client, mail, audit, rate-limit (Upstash Redis), csrf, sanitize, seo, tracking

### Payments & integrations

Mercado Pago (`src/lib/mercadopago*.ts`, `src/lib/payments/`) — CSP allowlists `sdk.mercadopago.com` and related domains. Melhor Envio for shipping (`src/lib/melhor-envio/`, `src/lib/shipping/`). WhatsApp outreach runs as a separate Baileys-based service in `services/whatsapp/` (own `package.json`/`tsconfig.json`, communicates with the main app via Supabase).

### Deployment

Docker + EasyPanel/Hostinger VPS (`Dockerfile`, `docker-compose.prod.yml`, `docs/VPS_SETUP.md`, `docs/EASYPANEL_ENV.md`, `docs/ENV_REFERENCE.md`). Public runtime env not baked into the build is served from `/api/config/public` and picked up by `src/lib/supabase/client.ts`.

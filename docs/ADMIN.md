# Admin Dashboard

## Routes

| Route | Description |
|-------|-------------|
| `/admin` | KPIs + revenue chart |
| `/admin/produtos` | Product list + CSV stubs |
| `/admin/produtos/novo` | Create product |
| `/admin/produtos/[id]` | Edit product |
| `/admin/categorias` | Category CRUD |
| `/admin/pedidos` | Orders list |
| `/admin/pedidos/[id]` | Order detail + status/tracking |
| `/admin/clientes` | Customers list |
| `/admin/clientes/[id]` | Customer + order history |
| `/admin/blog` | Posts + categories/tags |
| `/admin/blog/novo` | New post |
| `/admin/blog/[id]` | Edit post |
| `/admin/cupons` | Coupons list |
| `/admin/cupons/novo` | New coupon |
| `/admin/cupons/[id]` | Edit coupon |
| `/admin/configuracoes` | Mercado Pago, WhatsApp, SMTP tabs |
| `/admin/whatsapp` | QR connect placeholder |
| `/admin/auditoria` | AuditLog table |
| `/login` | Admin sign-in |

## Auth guard

1. **Middleware** (`src/middleware.ts`): blocks `/admin/*` unless `session.user.role === ADMIN` or email matches `ADMIN_EMAIL`.
2. **Layout** (`src/app/admin/layout.tsx`): `requireAdmin()` server redirect to `/login?callbackUrl=...`.
3. **Server actions**: `withAdmin()` wraps mutations.

## Setting keys (`Setting` model)

- `mercadopago.public_key`
- `mercadopago.access_token`
- `mercadopago.webhook_secret`
- `smtp.host`
- `smtp.port`
- `smtp.user`
- `smtp.password`
- `smtp.from`

WhatsApp status reads `WhatsappSession` (`sessionId: default`), not Setting keys.

## Env

```env
DATABASE_URL=
AUTH_SECRET=
ADMIN_EMAIL=admin@example.com
```

## Blockers

- Run `pnpm db:migrate` after schema merge with other agents.
- Seed an admin user (`role: ADMIN`) or set `ADMIN_EMAIL` to an existing user email.
- Baileys QR requires external `pnpm whatsapp:dev` service.
- CSV import/export are audited stubs only.

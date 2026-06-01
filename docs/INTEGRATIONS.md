# Integrations reference

## Environment variables

See `env.example` (dev) and `env.production.example` (prod). Full table: [ENV_REFERENCE.md](./ENV_REFERENCE.md). Required for production:

- `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- `WHATSAPP_SERVICE_URL`, `WHATSAPP_SERVICE_SECRET`, `WHATSAPP_ADMIN_NUMBER`
- `S3_*` (MinIO)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if using Google login)

Optional: `REDIS_URL`, `UPSTASH_*`, `SMTP_*`

## CSRF flow

1. `GET /api/auth/csrf` → sets HttpOnly cookie + returns `{ csrfToken }`
2. Send `x-csrf-token: <csrfToken>` on `register`, `forgot-password`, `reset-password`

## Order notification hooks

| Hook | Email | WhatsApp admin |
|------|-------|----------------|
| `onNewOrder` | — | ✓ |
| `onOrderPaid` | confirmado | pagamento aprovado |
| `onOrderShipped` | enviado | enviado |
| `onOrderDelivered` | entregue | — |
| `onOrderCancelled` | — | cancelado |
| `onTrackingUpdate` | rastreamento | — |

## Blockers / follow-ups

1. **UI**: Login, reset-password, checkout pages not included (API-only).
2. **Product model**: `OrderItem.productId` is optional; catalog schema can be added by storefront team.
3. **Baileys auth**: Service uses file auth + DB metadata; production may need full creds serialization in `WhatsappSession.keys`.
4. **Mercado Pago**: Webhook signature format may vary by MP API version — validate in sandbox.
5. **Postal**: Docker template commented; configure SMTP host manually until Postal is deployed.
6. **pnpm-lock.yaml**: Run `pnpm install` locally to generate lockfile before CI/Docker `--frozen-lockfile`.

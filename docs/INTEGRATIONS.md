# Integrations reference

## Environment variables

See `env.example` (dev) and `env.production.example` (prod). Full table: [ENV_REFERENCE.md](./ENV_REFERENCE.md). Required for production:

- `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`
- `WHATSAPP_SERVICE_URL`, `WHATSAPP_SERVICE_SECRET`
- Mercado Pago: **Admin → Configurações** (banco Postgres/Supabase, not env)
- Melhor Envio (frete): **Admin → Configurações → Frete e Envio** (OAuth + credenciais no banco)
- WhatsApp destinatários: **Admin → WhatsApp** (`WhatsappRecipient` table)
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

## Melhor Envio (cálculo de frete)

1. Crie um aplicativo em [Melhor Envio Sandbox](https://sandbox.melhorenvio.com.br) e/ou [Produção](https://melhorenvio.com.br) (Área Dev / Integrações).
2. Cadastre a **Redirect URI** exatamente como:
   `{NEXT_PUBLIC_APP_URL}/api/integrations/melhor-envio/callback`
3. Em **Admin → Configurações → Frete e Envio**:
   - Preencha o endereço de origem (CEP obrigatório)
   - Salve Client ID e Client Secret (sandbox e/ou produção)
   - Ative o toggle **Modo sandbox** para testes
   - Clique em **Conectar Melhor Envio** (OAuth, scope `shipping-calculate`)
4. Nos produtos, use o modo **Calculado via Melhor Envio** e informe peso/dimensões.

Tokens expiram em ~30 dias; o sistema renova automaticamente via `refresh_token` quando possível.

## Blockers / follow-ups

1. **Checkout transparente**: Wizard em `/checkout` (PIX, cartão via Card Brick, boleto). Credenciais sandbox e produção separadas no admin. Webhook em `/api/webhooks/mercadopago`.
2. **Product model**: `OrderItem.productId` is optional; catalog schema can be added by storefront team.
3. **Baileys auth**: Service uses file auth + DB metadata; production may need full creds serialization in `WhatsappSession.keys`.
4. **Mercado Pago**: Webhook signature format may vary by MP API version — validate in sandbox.
5. **Postal**: Docker template commented; configure SMTP host manually until Postal is deployed.
6. **pnpm-lock.yaml**: Run `pnpm install` locally to generate lockfile before CI/Docker `--frozen-lockfile`.

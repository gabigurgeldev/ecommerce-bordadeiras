# Integrations reference

## Environment variables

See `env.example` (dev) and `env.production.example` (prod). Full table: [ENV_REFERENCE.md](./ENV_REFERENCE.md). Required for production:

- `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`
- `WHATSAPP_SERVICE_URL`, `WHATSAPP_SERVICE_SECRET`
- Mercado Pago: **Admin → Configurações** (banco Postgres/Supabase, not env)
- Melhor Envio (frete): **Admin → Configurações → Frete e Envio** (Access Token no banco)
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

A integração usa **Access Token** gerado no painel do Melhor Envio (sem OAuth). O token é enviado como `Authorization: Bearer {token}` nas chamadas à API.

### Onde gerar o token

| Ambiente | Painel | Caminho |
|----------|--------|---------|
| Sandbox | [sandbox.melhorenvio.com.br](https://sandbox.melhorenvio.com.br) | Integrações → **Permissões de Acesso** → gerar token com permissão `shipping-calculate` |
| Produção | [melhorenvio.com.br](https://melhorenvio.com.br) | [painel/gerenciar/tokens](https://melhorenvio.com.br/painel/gerenciar/tokens) ou Permissões de Acesso |

O token expira em ~30 dias (JWT). O admin exibe a data de validade decodificando o campo `exp`.

### Configuração no admin

1. Em **Admin → Configurações → Frete e Envio**, preencha o endereço de origem (CEP obrigatório).
2. Ative **Modo sandbox** para testes ou desative para produção.
3. Cole o **Access Token** do ambiente correspondente (Sandbox ou Produção) e clique em **Salvar token**.
4. Clique em **Testar conexão API** para validar o token contra a API real do Melhor Envio.
5. Nos produtos, use o modo **Calculado via Melhor Envio** e informe peso/dimensões.

### Renovação

Quando o token expirar, gere um novo no painel ME e cole novamente no admin. Não há renovação automática.

### Bloqueio de rede (HTTP 403)

Se **Testar conexão API** retornar HTTP 403 com resposta HTML, o servidor de hospedagem pode estar bloqueando saída HTTPS para `melhorenvio.com.br` ou `sandbox.melhorenvio.com.br`. Nesse caso, libere o acesso na hospedagem ou verifique variáveis `HTTP_PROXY`/`HTTPS_PROXY`.

## Blockers / follow-ups

1. **Checkout transparente**: Wizard em `/checkout` (PIX, cartão via Card Brick, boleto). Credenciais sandbox e produção separadas no admin. Webhook em `/api/webhooks/mercadopago`.
2. **Product model**: `OrderItem.productId` is optional; catalog schema can be added by storefront team.
3. **Baileys auth**: Service uses file auth + DB metadata; production may need full creds serialization in `WhatsappSession.keys`.
4. **Mercado Pago**: Webhook signature format may vary by MP API version — validate in sandbox.
5. **Postal**: Docker template commented; configure SMTP host manually until Postal is deployed.
6. **pnpm-lock.yaml**: Run `pnpm install` locally to generate lockfile before CI/Docker `--frozen-lockfile`.

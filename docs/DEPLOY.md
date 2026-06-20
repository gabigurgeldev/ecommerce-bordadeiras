# Deploy — Hostinger VPS + EasyPanel

> **Guia completo:** [VPS_SETUP.md](./VPS_SETUP.md) (domínios, Docker, Supabase, MinIO, WhatsApp, firewall, SSL).  
> **Variáveis:** [ENV_REFERENCE.md](./ENV_REFERENCE.md) · **Exemplo produção:** `env.production.example` · **Compose:** `docker-compose.prod.yml`

Checklist resumido para publicar o Ecommerce Bordadeiras em VPS Hostinger usando [EasyPanel](https://easypanel.io).

## 1. VPS Hostinger

1. Crie um VPS (Ubuntu 22.04+ recomendado).
2. Aponte o domínio (ex.: `loja.seudominio.com`) para o IP do VPS (registro A).
3. SSH: `ssh root@SEU_IP`

## 2. Instalar EasyPanel

```bash
curl -sSL https://get.easypanel.io | sh
```

Acesse `http://SEU_IP:3000` (porta padrão do painel) e crie o projeto `bordadeiras`.

## 3. Serviços no EasyPanel

Crie os serviços abaixo (Docker Compose ou apps individuais).

### Supabase (PostgreSQL)

- Self-hosted: [https://supabase.bordadeiras.cloud](https://supabase.bordadeiras.cloud)
- Variáveis na app: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Não cole `DATABASE_URL` em ambientes persistentes da app/WhatsApp. Use URI direta do Postgres apenas em job operacional one-off, se uma ferramenta legada exigir.
- Migrations Supabase: SQL versionado em `supabase/migrations/`

### Redis 7

- Imagem: `redis:7-alpine`
- URL interna: `redis://redis:6379`

### MinIO

- Imagem: `minio/minio`
- Comando: `server /data --console-address ":9001"`
- Variáveis: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`
- Crie o bucket `bordadeiras` no console (porta 9001)

### WhatsApp service

- Build: repositório Git, Dockerfile `services/whatsapp/Dockerfile`
- Porta: `4001`
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_SERVICE_SECRET`
- Volume: `/app/data/auth` (sessão Baileys)

### App Next.js

- Build: Dockerfile na raiz
- Porta: `3000`
- Domínio + SSL (Let's Encrypt no EasyPanel)
- Env: copie de `.env.example` (produção)

## 4. Variáveis de produção (app)

| Variável | Exemplo |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase.bordadeiras.cloud` |
| `SUPABASE_SERVICE_ROLE_KEY` | Studio → Settings → API (server-only) |
| `NEXT_PUBLIC_APP_URL` | idem |
| Mercado Pago | Admin → Configurações (Postgres) |
| `WHATSAPP_SERVICE_URL` | `http://whatsapp-service:4001` |
| `S3_ENDPOINT` | URL interna MinIO |
| `REDIS_URL` | `redis://redis:6379` |

## 5. Migrations e seed

No container da app (terminal EasyPanel ou one-off job):

```bash
npx --yes prisma@6 migrate deploy
node prisma/seed.bundle.cjs
```

Recuperação EasyPanel (foundation já aplicada, seed falhando): [EASYPANEL_RECOVERY.md](./EASYPANEL_RECOVERY.md).

Altere `ADMIN_PASSWORD` antes do seed em produção.

## 6. Mercado Pago webhook

No [painel Mercado Pago](https://www.mercadopago.com.br/developers):

- URL: `https://loja.seudominio.com/api/webhooks/mercadopago`
- Eventos: `payment`
- Configure webhook secret em Admin → Configurações → Mercado Pago

## 7. Postal SMTP (opcional)

Descomente o serviço `postal` em `docker-compose.yml` ou instale Postal separado no EasyPanel.

Atualize settings no banco (`mail.*`) ou variáveis `SMTP_*`.

## 8. WhatsApp QR

1. Acesse como ADMIN: `GET /api/admin/whatsapp/qr`
2. Escaneie o QR com o WhatsApp do número administrativo
3. Cadastre destinatários em Admin → WhatsApp; conecte emissor via QR

## 9. Checklist pós-deploy

- [ ] HTTPS ativo
- [ ] Login Google (redirect URI em Google Cloud Console)
- [ ] Webhook MP retornando 200
- [ ] E-mail de teste (cadastro / pedido)
- [ ] Upload de imagens no admin via `/api/uploads/direct`
- [ ] Notificação WhatsApp em pedido de teste
- [ ] Rate limit Upstash (opcional) ou memória OK em baixo tráfego

## 10. Atualizações

```bash
git pull
# Rebuild app + whatsapp no EasyPanel
npx --yes prisma@6 migrate deploy
```

## Troubleshooting

| Problema | Ação |
|----------|------|
| 502 na app | Ver logs do container; conferir `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` |
| Webhook MP 401 | Conferir webhook secret em Admin → Configurações |
| WhatsApp desconecta | `POST /api/admin/whatsapp/reconnect` |
| E-mail não envia | Testar SMTP; settings `mail.*` no banco |

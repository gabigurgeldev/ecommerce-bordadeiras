# WhatsApp service

Microserviço Baileys para envio de mensagens. Compartilha o **mesmo PostgreSQL** da app Next.js via Prisma (`prisma/schema.prisma` na raiz do monorepo).

## Variáveis

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | **Inalterada** — mesma URI Postgres da app (`postgresql://...`). Aponta para Supabase ou Postgres local. |
| `PORT` | Porta HTTP do serviço (padrão `4001`) |
| `WHATSAPP_SERVICE_SECRET` | Segredo compartilhado com a app para chamadas internas |

Ver `services/whatsapp/.env.example`.

## Autenticação com a app principal

Este serviço **não** usa Supabase Auth nem sessão de loja/admin. Acesso à API interna é validado com `WHATSAPP_SERVICE_SECRET` (header/bearer conforme implementado em `src/index.ts`).

Login de clientes e admin permanece na app Next.js (`/login`, Supabase Auth + Prisma `User`).

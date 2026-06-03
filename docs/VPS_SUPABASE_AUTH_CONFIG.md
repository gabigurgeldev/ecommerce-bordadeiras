# Auth URLs no Supabase self-hosted (VPS)

No **Supabase Cloud**, Site URL e Redirect URLs aparecem em **Authentication → URL Configuration**.

No **self-hosted** (`supabase.bordadeiras.cloud`), o Studio costuma mostrar só **Users** e **Policies**. Isso é normal — a configuração fica no **`.env` do stack Supabase na VPS** (serviço **Auth / GoTrue**), não no painel do ecommerce.

## O que configurar na VPS (stack Supabase)

No servidor onde roda o Docker do Supabase, edite o `.env` do projeto Supabase (pasta do `docker compose` do Supabase — não o `.env` da loja).

Use a URL real da loja:

```env
# URL pública da loja (Site URL)
SITE_URL=https://bordadeirasdeserrapelada.com.br

# URLs permitidas após login, confirmação de e-mail e reset de senha
# Várias URLs separadas por vírgula (sem espaço)
ADDITIONAL_REDIRECT_URLS=https://bordadeirasdeserrapelada.com.br/auth/callback,https://bordadeirasdeserrapelada.com.br/auth/callback?next=/conta,https://bordadeirasdeserrapelada.com.br/auth/callback?next=/reset-password
```

Em instalações que usam prefixo `GOTRUE_` (versões antigas do compose oficial):

```env
GOTRUE_SITE_URL=https://bordadeirasdeserrapelada.com.br
GOTRUE_URI_ALLOW_LIST=https://bordadeirasdeserrapelada.com.br/auth/callback,https://bordadeirasdeserrapelada.com.br/**
```

Também confira no mesmo `.env`:

```env
API_EXTERNAL_URL=https://supabase.bordadeiras.cloud
SUPABASE_PUBLIC_URL=https://supabase.bordadeiras.cloud
```

Depois de salvar:

```bash
docker compose down
docker compose up -d
# ou reinicie só o container auth / kong conforme seu stack
```

## O que configurar no EasyPanel (app da loja)

Isso é **separado** do Supabase Auth — são variáveis do **Next.js**:

```env
NEXT_PUBLIC_APP_URL=https://bordadeirasdeserrapelada.com.br
NEXT_PUBLIC_SITE_URL=https://bordadeirasdeserrapelada.com.br
NEXT_PUBLIC_SUPABASE_URL=https://supabase.bordadeiras.cloud
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Rebuild/redeploy** da app após alterar `NEXT_PUBLIC_*`.

## Login só com e-mail e senha

Para `signInWithPassword` (login normal), **Site URL no GoTrue ajuda**, mas o erro `Missing NEXT_PUBLIC_SUPABASE_*` vem só das variáveis da **app** no EasyPanel — não do menu Auth do Studio.

## Onde pegar anon key e service role

**Project Settings** (ícone engrenagem no Studio) → **API** — não está em Authentication → Users.

## Callback usado pelo projeto

| Fluxo | URL |
|-------|-----|
| OAuth / confirmar e-mail | `/auth/callback` |
| Cadastro | `/auth/callback?next=/conta` |
| Reset de senha | `/auth/callback?next=/reset-password` |

Todas devem estar permitidas em `ADDITIONAL_REDIRECT_URLS` (ou `GOTRUE_URI_ALLOW_LIST`).

## Desenvolvimento local

```env
SITE_URL=http://localhost:3000
ADDITIONAL_REDIRECT_URLS=http://localhost:3000/auth/callback,http://localhost:3000/auth/callback?next=/conta,http://localhost:3000/auth/callback?next=/reset-password
```

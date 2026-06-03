# Recuperação EasyPanel — banco, login e admin

## Variáveis obrigatórias (serviço **app**)

| Variável | Exemplo | Erro se incorreto |
|----------|---------|-------------------|
| `NEXT_PUBLIC_APP_URL` | `https://loja.seudominio.com.br` | Redirects Auth (reset, callback) |
| `DATABASE_URL` | `postgresql://postgres:pass@supabase.bordadeiras.cloud:5432/postgres` | Nada salva no admin |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase.bordadeiras.cloud` | Auth + URLs públicas de imagens |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key do Studio | Login no browser |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (server-only) | Upload admin + migração legacy |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | definidos **antes** do seed | Admin não existe |
| `RUN_DB_SEED` | `false` durante recuperação | Container em loop no seed |

**Storage (Studio → Storage):** buckets públicos `product-images` e `banners`. Uploads via `/api/uploads/direct` (service role no servidor).

## Passo a passo — banco desatualizado (P2021 / P3018)

1. EasyPanel → app → `RUN_DB_SEED=false` → **Redeploy**.
2. Console do container **app** (com Supabase/Postgres acessível):

```bash
sh scripts/easypanel-db-recovery.sh
```

Ou manualmente:

```bash
npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline
npx --yes prisma@6 migrate deploy
npx --yes prisma@6 migrate status
# Seed só se RUN_DB_SEED=true e ambiente seguro:
node prisma/seed.bundle.cjs
```

3. Volte `RUN_DB_SEED=true` se quiser seed no próximo deploy (após migrations OK).
4. Logado como admin: `GET https://SEU_DOMINIO/api/setup/status` → `adminInDatabase: true`.

## Diagnóstico rápido

| Sintoma | Ação |
|---------|------|
| `Table 'StorefrontBanner' does not exist` | `migrate deploy` (passos acima) |
| `User already exists` (P3018) | `migrate resolve --applied 20250603130000_postgresql_baseline` |
| `npx prisma` P1012 (url no schema) | Use **`npx --yes prisma@6`**, nunca Prisma 7 |
| `/admin` abre sem pedir login | Faça **Sair** no menu admin; sessão JWT ainda válida |
| Imagens não sobem | Confira MinIO + bucket; use build com `/api/uploads/direct` |

Rotacione senhas se `.env` com credenciais reais foi commitado no passado.

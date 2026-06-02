# Recuperação EasyPanel — banco, login e admin

## Variáveis obrigatórias (serviço **app**)

| Variável | Exemplo | Erro se incorreto |
|----------|---------|-------------------|
| `AUTH_URL` | `https://loja.seudominio.com.br` | Login/cookies quebrados |
| `AUTH_SECRET` | 32+ caracteres aleatórios | Sessão inválida |
| `DATABASE_URL` | `mysql://user:pass@NOME_SERVICO_MYSQL:3306/bordadeiras` | Nada salva no admin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | definidos **antes** do seed | Admin não existe |
| `S3_ENDPOINT` | `http://NOME_MINIO:9000` (interno) | Upload falha no browser* |
| `S3_PUBLIC_URL` | `https://storage.seudominio.com.br` | Imagens quebradas na loja |
| `S3_BUCKET` | `bordadeiras-uploads` | Upload 403/404 |
| `RUN_DB_SEED` | `false` durante recuperação | Container em loop no seed |

\* Com deploy recente, uploads usam `/api/uploads/direct` (via servidor); `S3_ENDPOINT` interno continua necessário.

## Passo a passo — banco desatualizado (P2021 / P3018)

1. EasyPanel → app → `RUN_DB_SEED=false` → **Redeploy**.
2. Console do container **app** (com MySQL online):

```bash
sh scripts/easypanel-db-recovery.sh
```

Ou manualmente:

```bash
npx --yes prisma@6 migrate resolve --applied 20250601170000_foundation
npx --yes prisma@6 migrate deploy
node prisma/seed.bundle.cjs
```

3. Volte `RUN_DB_SEED=true` se quiser seed no próximo deploy (após migrations OK).
4. Logado como admin: `GET https://SEU_DOMINIO/api/setup/status` → `adminInDatabase: true`.

## Diagnóstico rápido

| Sintoma | Ação |
|---------|------|
| `Table 'StorefrontBanner' does not exist` | `migrate deploy` (passos acima) |
| `User already exists` (P3018) | `migrate resolve --applied` na foundation |
| `npx prisma` P1012 (url no schema) | Use **`npx --yes prisma@6`**, nunca Prisma 7 |
| `/admin` abre sem pedir login | Faça **Sair** no menu admin; sessão JWT ainda válida |
| Imagens não sobem | Confira MinIO + bucket; use build com `/api/uploads/direct` |

Rotacione senhas se `.env` com credenciais reais foi commitado no passado.

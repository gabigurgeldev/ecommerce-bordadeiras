# Migração de dados MySQL → PostgreSQL (Supabase)

> **Quando usar:** cutover de produção com dados existentes no MySQL EasyPanel.  
> **Pré-requisito:** `supabase/migrations/*.sql` já aplicadas no Postgres alvo (schema vazio de linhas, tabelas criadas).

Não execute estes passos sem **backup** do MySQL e snapshot do Postgres. Este repositório **não** contém credenciais reais — substitua placeholders no VPS.

---

## 1. Variáveis (EasyPanel / shell na VPS)

```bash
# Origem (MySQL legado — somente leitura após export final)
export MYSQL_URL="mysql://USER:PASS@mysql-host:3306/bordadeiras"

# Destino (Postgres direct — porta 5432, sem pooler)
export DATABASE_URL="postgresql://postgres:SENHA@supabase.bordadeiras.cloud:5432/postgres"
```

Confirme conectividade:

```bash
mysql -h HOST -u USER -p -e "SELECT COUNT(*) FROM User;" bordadeiras
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM "User";'
```

Se `"User"` no Postgres retornar erro de tabela inexistente, aplique antes:

```bash
psql "$DATABASE_URL" -f supabase/migrations/20250601170000_foundation.sql
psql "$DATABASE_URL" -f supabase/migrations/20250602180000_storefront_banner.sql
psql "$DATABASE_URL" -f supabase/migrations/20250602190000_storefront_trust_item.sql
psql "$DATABASE_URL" -f supabase/migrations/20250603120000_rls_baseline.sql
```

---

## 2. Opção A — pgloader (recomendado)

Instale [pgloader](https://pgloader.io/) na VPS ou use container:

```bash
cat > /tmp/mysql-to-pg.load <<'EOF'
LOAD DATABASE
  FROM mysql://USER:PASS@mysql-host:3306/bordadeiras
  INTO postgresql://postgres:SENHA@supabase.bordadeiras.cloud:5432/postgres

WITH include drop, create tables, create indexes, reset sequences,
     workers = 4, concurrency = 1

SET PostgreSQL PARAMETERS
  maintenance_work_mem to '256MB',
  work_mem to '64MB'

CAST type datetime to timestamptz drop default drop not null using zero-dates-to-null,
     type date drop not null drop default using zero-dates-to-null

ALTER SCHEMA 'bordadeiras' RENAME TO 'public';
EOF

pgloader /tmp/mysql-to-pg.load
```

**Atenção:** pgloader pode recriar objetos. Em cutover com schema já aplicado via `supabase/migrations/`, prefira **Opção B** (carga de dados apenas) ou ajuste o `.load` para `WITH data only` após validar mapeamento de tabelas.

Exemplo data-only (schema Postgres já existe):

```bash
# Liste tabelas na ordem de FKs (User primeiro, depois dependentes)
pgloader --with "data only" /tmp/mysql-to-pg.load
```

---

## 3. Opção B — Export MySQL + transformação manual

### 3.1 Dump lógico

```bash
mysqldump -h HOST -u USER -p \
  --single-transaction \
  --routines=false \
  --triggers=false \
  --set-gtid-purged=OFF \
  --no-create-info \
  --complete-insert \
  bordadeiras > /tmp/bordadeiras-data.sql
```

### 3.2 Ajustes antes do import

| MySQL | PostgreSQL |
|-------|------------|
| `` `Order` `` | `"Order"` |
| `` `User` `` | `"User"` |
| Backticks em identificadores | Aspas duplas |
| `\0` em strings | Remover ou escapar |
| `0000-00-00` | `NULL` |

Ordem de carga (respeitar FKs):

1. `User`, `Category`, `BlogCategory`, `BlogTag`, `Coupon`, `EmailTemplate`, `Setting`
2. `Address`, `Product`, `BlogPost`, `StorefrontBanner`, `StorefrontTrustItem`
3. `ProductImage`, `BlogPostTag`, `Order`, `OrderItem`, `Payment`, `Tracking`
4. `Notification`, `WhatsappRecipient`, `WhatsappSession`, `AuditLog`
5. `Account`, `VerificationToken`, `PasswordResetToken`

### 3.3 Import

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/bordadeiras-data-pg.sql
```

---

## 4. Pós-carga: Prisma baseline

Com schema Supabase + dados carregados:

```bash
npx --yes prisma@6 migrate resolve --applied 20250603130000_postgresql_baseline
npx --yes prisma@6 migrate deploy
npx --yes prisma@6 migrate status
```

---

## 5. Validação

```bash
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM "User";'
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM "Order";'
psql "$DATABASE_URL" -c 'SELECT COUNT(*) FROM "Product";'
```

Compare contagens com MySQL. Teste login admin, um pedido histórico e webhook MP em sandbox.

---

## 6. Cutover EasyPanel

1. Pausar webhooks Mercado Pago / modo manutenção.
2. Sync final MySQL → Postgres (repetir export ou delta).
3. App + WhatsApp: `DATABASE_URL=postgresql://...` (direct ou pooler com `?pgbouncer=true` na app).
4. `RUN_DB_SEED=false` no primeiro deploy pós-migração.
5. Redeploy; smoke tests; reativar webhooks.
6. Manter MySQL read-only 7–14 dias para rollback.

Ver também: `docs/EXECUCAO_CUTOVER_SUPABASE.md`, `docs/MIGRACAO_SUPABASE.md`.

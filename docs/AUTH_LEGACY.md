# Autenticação — Supabase Auth e usuários legados

## Atual (Supabase Auth)

- Sessão via cookies gerenciados por `@supabase/ssr` (`getUser()` no servidor).
- Papéis de loja/admin continuam na tabela Prisma `User` (`role`), sincronizada por **e-mail** no login/cadastro.
- Callback OAuth/recuperação: `/auth/callback`.
- Recuperação de senha: `supabase.auth.resetPasswordForEmail` → link → `/reset-password`.

## Usuários legados (bcrypt em `User.passwordHash`)

Contas criadas antes da migração mantêm hash bcrypt no Postgres. No **primeiro login** após a migração:

1. `signInWithPassword` no Supabase falha.
2. O servidor valida bcrypt via `verifyUserCredentials`.
3. Com `SUPABASE_SERVICE_ROLE_KEY`, cria/atualiza o usuário em `auth.users` e tenta login de novo.

Novos cadastros usam apenas Supabase Auth (`signUp`); o Prisma `User` é criado/atualizado sem `passwordHash`.

## Variáveis obrigatórias

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente browser + SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Migração legada, operações admin no Auth |
| `NEXT_PUBLIC_APP_URL` | Redirects de e-mail (cadastro, reset) |

`AUTH_SECRET` / `AUTH_URL` (NextAuth) **não são mais necessários**.

## Confirmação de e-mail

- Supabase: `email_confirmed_at` no JWT.
- Legado Prisma: `User.emailVerified` (código SMTP antigo em `/verificar-email`).

O login exige confirmação em um dos dois (exceto `ADMIN`).

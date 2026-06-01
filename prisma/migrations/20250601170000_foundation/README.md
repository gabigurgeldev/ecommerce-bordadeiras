# Foundation migration

On a fresh database, generate the full SQL from `schema.prisma`:

```bash
npm run db:migrate
```

For local development without migration history:

```bash
npm run db:push
```

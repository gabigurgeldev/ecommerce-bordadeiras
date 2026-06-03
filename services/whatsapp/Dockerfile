# Build context: raiz do repositório (EasyPanel)
# Fonte: Github | Caminho: / | Dockerfile: services/whatsapp/Dockerfile

FROM node:22-alpine
WORKDIR /app

# git: Baileys e dependências podem instalar via repositório Git
RUN apk add --no-cache openssl libc6-compat git python3 make g++

COPY services/whatsapp/package.json ./
# prisma + tsx em runtime; DATABASE_URL (PostgreSQL) via env_file — ver .env.example
RUN npm install --no-audit --no-fund

COPY prisma ./prisma
COPY services/whatsapp/tsconfig.json ./
COPY services/whatsapp/src ./src

RUN npx prisma generate --schema=./prisma/schema.prisma

ENV PORT=4001
ENV NODE_ENV=production
EXPOSE 4001

RUN mkdir -p /app/data/auth

# Sessão Baileys — volume persistente em /app/data/auth
CMD ["npx", "tsx", "src/index.ts"]

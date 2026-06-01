# Build context: raiz do repositório (EasyPanel → Dockerfile: services/whatsapp/Dockerfile, path: /)
FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

COPY services/whatsapp/package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY prisma ./prisma
COPY services/whatsapp/tsconfig.json ./
COPY services/whatsapp/src ./src

RUN npx prisma generate --schema=./prisma/schema.prisma

ENV PORT=4001
EXPOSE 4001

# Sessão Baileys — monte volume em /app/data/auth (não commitar no Git)
CMD ["npx", "tsx", "src/index.ts"]

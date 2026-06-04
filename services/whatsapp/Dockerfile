# Build context: raiz do repositório (EasyPanel)
# Fonte: Github | Caminho: / | Dockerfile: services/whatsapp/Dockerfile

FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat git python3 make g++

COPY services/whatsapp/package.json ./
RUN npm install --no-audit --no-fund

COPY services/whatsapp/tsconfig.json ./
COPY services/whatsapp/src ./src

ENV PORT=4001
ENV NODE_ENV=production
EXPOSE 4001

RUN mkdir -p /app/data/auth

# Supabase: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY via env
CMD ["npx", "tsx", "src/index.ts"]

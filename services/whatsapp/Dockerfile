# Build context: raiz do repositório (EasyPanel)
# Fonte: Github | Caminho: / | Dockerfile: services/whatsapp/Dockerfile

FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat
COPY services/whatsapp/package.json services/whatsapp/package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS builder
COPY services/whatsapp/tsconfig.json ./
COPY services/whatsapp/src ./src
RUN npm run build \
  && npm prune --omit=dev --no-audit --no-fund

FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 whatsapp

ENV PORT=4001
ENV NODE_ENV=production

COPY --from=builder --chown=whatsapp:nodejs /app/package.json ./package.json
COPY --from=builder --chown=whatsapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=whatsapp:nodejs /app/dist ./dist

RUN mkdir -p /app/data/auth \
  && chown -R whatsapp:nodejs /app/data

USER whatsapp
EXPOSE 4001

# Supabase: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY via env
CMD ["node", "dist/index.js"]

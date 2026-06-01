# syntax=docker/dockerfile:1
# Produção EasyPanel / VPS — usa npm (package-lock.json)

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

FROM base AS deps
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# Bundle do seed para produção (bcryptjs + deps dentro do .cjs; @prisma/client externo)
RUN npx --yes esbuild@0.25.12 prisma/seed.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile=prisma/seed.bundle.cjs \
  --external:@prisma/client

RUN mkdir -p /prisma-runtime/node_modules \
  && cp -r node_modules/.prisma /prisma-runtime/node_modules/.prisma \
  && cp -r node_modules/@prisma /prisma-runtime/node_modules/@prisma

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV RUN_DB_SEED=true
RUN apk add --no-cache openssl \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /prisma-runtime/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /prisma-runtime/node_modules/@prisma ./node_modules/@prisma
COPY --chmod=755 scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

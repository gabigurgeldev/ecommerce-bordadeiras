FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY services/whatsapp/package.json ./
RUN pnpm install

COPY prisma ./prisma
COPY services/whatsapp/tsconfig.json ./
COPY services/whatsapp/src ./src

ENV DATABASE_URL=mysql://bordadeiras:bordadeiras@mysql:3306/bordadeiras
RUN pnpm exec prisma generate --schema=./prisma/schema.prisma

EXPOSE 4001
CMD ["pnpm", "exec", "tsx", "src/index.ts"]

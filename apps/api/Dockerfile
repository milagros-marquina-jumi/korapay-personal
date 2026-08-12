FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@11 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/domain/package.json ./packages/domain/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/domain ./packages/domain
COPY packages/typescript-config ./packages/typescript-config
RUN pnpm --filter @korapay/api build

FROM base AS runner
COPY --from=builder /app ./

ENV NODE_ENV=production
ENV PORT=3061

EXPOSE 3061
CMD ["node", "apps/api/dist/main.js"]

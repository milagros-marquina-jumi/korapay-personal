FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@11 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/domain/package.json ./packages/domain/
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/domain ./packages/domain
RUN pnpm --filter @korapay/api build

FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/packages/domain ./packages/domain

ENV NODE_ENV=production
ENV PORT=3061

EXPOSE 3061
CMD ["node", "dist/main.js"]

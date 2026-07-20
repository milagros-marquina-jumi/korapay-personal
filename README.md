# KoraPay

Gestion financiera personal y empresarial. Evolucion de Mi Bolsillo.

## Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + shadcn/ui
- **Backend**: NestJS 11 + Fastify + Prisma ORM
- **Database**: PostgreSQL
- **Auth**: Demo mode (local dev)
- **Monorepo**: Turborepo + pnpm workspaces

## Requisitos

- Node.js 24 LTS
- pnpm 11
- PostgreSQL 16+ (Docker o local)

## Inicio rapido

```bash
pnpm install
pnpm docker:up          # PostgreSQL en puerto 5435
pnpm db:push            # Sincronizar esquema
pnpm db:seed            # Datos demo
pnpm dev                # Web :3060 + API :3061
```

## Credenciales demo

```
demo@korapay.local / KoraPay123!
```

Solo disponibles en desarrollo con `DEMO_MODE=true`.

## Estructura

```
korapay/
  apps/
    web/          # Next.js frontend
    api/          # NestJS backend
  packages/
    ui/           # Componentes compartidos
    domain/       # Logica pura
    api-client/   # Cliente generado (Orval)
    config/       # Configuraciones compartidas
    eslint-config/
    typescript-config/
  prisma/         # Esquema y migraciones
  docs/           # Documentacion
  docker/         # Docker compose
```

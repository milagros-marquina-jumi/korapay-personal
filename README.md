# KoraPay

Gestion financiera personal y empresarial. Evolucion de Mi Bolsillo.

## Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + shadcn/ui
- **Backend**: NestJS 11 + Fastify + Prisma ORM
- **Base de datos**: PostgreSQL
- **Auth**: Modo demo
- **Monorepo**: Turborepo + pnpm workspaces

## Requisitos

- Node.js 24 LTS
- pnpm 10
- PostgreSQL 16+ (Docker)
- Fly.io CLI (solo para desplegar backend)

## Inicio rapido (local)

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm install
pnpm docker:up          # PostgreSQL en puerto 5435
pnpm db:migrate
pnpm db:seed
pnpm dev                # Web :3060 + API :3061
```

Swagger: `http://localhost:3061/api/docs`

## Credenciales demo

```
mila@korapay.demo / KoraPayAsesino1000
```

## Variables de entorno

- Backend: `apps/api/.env` (local) y `apps/api/.env.production` (produccion)
- Frontend: `apps/web/.env` (local) y `apps/web/.env.production` (produccion)
- Los `.env.example` son plantillas versionadas; los `.env` reales no se versionan.

## Despliegue

### Backend — Fly.io

```bash
flyctl deploy                        # desde la raiz (usa fly.toml + apps/api/Dockerfile)
flyctl secrets set KEY=VAL --app korapay-api
```

- App: `korapay-api` → https://korapay-api.fly.dev
- BD: `korapay-db` (PostgreSQL en Fly.io)
- Las migraciones corren solas en cada deploy (`release_command` en `fly.toml`).

### Frontend — Vercel

Conectado al repo GitHub `milagros-marquina-jumi/korapay-personal` (rama `master`).
Cada push a `master` dispara el deploy automatico.

- URL: https://korapay-web.vercel.app
- Env vars en Vercel: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`

Deploy manual (desde la raiz del repo, no desde `apps/web`):

```bash
vercel --prod
```

## Datos reales

El seed carga los datos del libro `KoraPay.xlsx`. Para regenerarlos si cambia el Excel:

```bash
python prisma/data/build.py
pnpm db:seed
```

## Estructura

```
korapay/
  apps/
    web/          # Next.js (App Router, route groups (app)/(auth))
    api/          # NestJS (Fastify, Prisma, guards multi-tenant)
  packages/
    ui/           # Componentes de dominio (KPICard, MoneyDisplay...)
    domain/       # Logica pura (money, enums, validacion)
    typescript-config/
  prisma/
    schema.prisma # Modelo de datos
    seed.ts       # Carga de datos reales
    data/         # JSON generados del Excel + build.py
  docs/           # Documentacion
  docker/         # Docker compose (PostgreSQL)
  fly.toml        # Configuracion de Fly.io (backend)
```

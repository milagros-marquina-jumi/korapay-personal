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
cp .env.example .env    # DEMO_MODE=true por defecto
pnpm install
pnpm docker:up          # PostgreSQL en puerto 5435
pnpm db:push            # Sincronizar esquema
pnpm db:seed            # Cargar datos reales (desde prisma/data/*.json)
pnpm dev                # Web :3060 + API :3061
```

Swagger: `http://localhost:3061/api/docs`.

## Datos reales

El seed carga los datos reales del libro `KoraPay.xlsx` (transcripcion 1:1). El
script `prisma/data/build.py` (Python + openpyxl) exporta cada hoja a
`prisma/data/*.json`, y `prisma/seed.ts` los mapea a las entidades correctas:
ingresos/egresos personales, costos y pagos de MIMOTECH, talentos y sus
distribuciones de ingreso, ahorros y obligaciones tributarias. Los numeros de
cuenta y tarjeta se enmascaran automaticamente (`redactSensitiveData`).

Regenerar los JSON si cambia el Excel:

```bash
python prisma/data/build.py
pnpm db:seed
```

## Credenciales demo

```
demo@korapay.local / KoraPay123!
```

Autenticacion local en modo demo (`DEMO_MODE=true`). El `AuthGuard` resuelve el
perfil demo desde la BD; no hay proveedor de auth externo.

## Estructura

```
korapay/
  apps/
    web/          # Next.js frontend (App Router, route groups (app)/(auth))
    api/          # NestJS backend (Fastify, Prisma, guards multi-tenant)
  packages/
    ui/           # Componentes de dominio compartidos (KPICard, MoneyDisplay...)
    domain/       # Logica pura (money, enums, validacion)
    typescript-config/
  prisma/
    schema.prisma # Modelo de datos
    seed.ts       # Carga de datos reales
    data/         # JSON generados del Excel + build.py
  docs/           # Documentacion
  docker/         # Docker compose (PostgreSQL)
```

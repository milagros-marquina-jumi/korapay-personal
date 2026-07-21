# KoraPay — Despliegue

## Requisitos

- Node.js 24 LTS
- pnpm 11
- PostgreSQL 16 (Docker local o servidor gestionado)
- Fly.io CLI (para backend)

## Variables de entorno

Copiar `.env.example` a `.env` y completar valores.

**NUNCA exponer en frontend:**
- `DATABASE_URL`
- `DIRECT_URL`

## Desarrollo local

```bash
pnpm install

# Base de datos local (Docker)
docker compose -f docker/docker-compose.dev.yml up -d

# Sincronizar esquema
pnpm db:push

# Datos reales del Excel
pnpm db:seed

# Iniciar
pnpm dev
```

Web: http://localhost:3060
API: http://localhost:3061
Swagger: http://localhost:3061/api/docs

## Autenticacion

Modo demo local (`DEMO_MODE=true`): el API resuelve el perfil demo desde la BD, sin
proveedor externo. Para produccion con usuarios reales habria que implementar un
proveedor de auth (JWT propio u OAuth) en `apps/api/src/common/auth/auth.guard.ts`.

## Despliegue Backend (Fly.io)

```bash
fly launch --name korapay-api
fly secrets set DATABASE_URL=...
fly secrets set DIRECT_URL=...
fly deploy
```

## Despliegue Frontend (Vercel)

Conectar repositorio en Vercel y configurar:

- Build Command: `pnpm build --filter=@korapay/web`
- Output Directory: `apps/web/.next`
- Root Directory: `korapay`

## Migraciones

```bash
pnpm db:migrate    # Desarrollo
# En produccion: prisma migrate deploy
```

## Rollback

- Base de datos: restaurar backup de PostgreSQL
- API: `fly deploy --image <previous-image>`
- Frontend: revertir deploy en Vercel

## Monitoreo

- Health: GET /api/v1/health
- Readiness: GET /api/v1/health/ready
- Logs: Pino JSON estructurado

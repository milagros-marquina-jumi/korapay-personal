# KoraPay — Despliegue

## Requisitos

- Node.js 24 LTS
- pnpm 11
- Supabase (Auth + PostgreSQL + Storage)
- Fly.io CLI (para backend)

## Variables de entorno

Copiar `.env.example` a `.env` y completar valores.

**NUNCA exponer en frontend:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

## Desarrollo local

```bash
# Instalar dependencias
pnpm install

# Base de datos local (opcional, sin Supabase)
docker compose -f docker/docker-compose.dev.yml up -d

# Sincronizar esquema
pnpm db:push

# Datos demo
pnpm db:seed

# Iniciar
pnpm dev
```

Web: http://localhost:3060
API: http://localhost:3061
Swagger: http://localhost:3061/api/docs

## Despliegue Backend (Fly.io)

```bash
fly launch --name korapay-api
fly secrets set DATABASE_URL=...
fly secrets set SUPABASE_URL=...
fly secrets set SUPABASE_SERVICE_ROLE_KEY=...
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

- Base de datos: restaurar backup de Supabase
- API: `fly deploy --image <previous-image>`
- Frontend: revertir deploy en Vercel

## Monitoreo

- Health: GET /api/v1/health
- Readiness: GET /api/v1/health/ready
- Logs: Pino JSON estructurado

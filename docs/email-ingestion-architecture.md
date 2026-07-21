# Arquitectura: ingesta de correos bancarios

## Flujo

```
Gmail (1..n)
  → Google Apps Script (etiqueta KoraPay/Bancos)
  → POST /api/v1/email-ingestion/messages  (Authorization: Bearer <token de la fuente>)
  → IngestionGuard resuelve la EmailSource por hash del token
  → deduplicación nivel 1 (emailSourceId + providerMessageId)
  → parser bancario (BCP / Interbank / BBVA / genérico)
  → fingerprint + deduplicación nivel 2 (misma compra entre correos)
  → reglas de conciliación (workspace/cuenta/categoría sugeridos)
  → asociación de tarjeta por últimos 4 dígitos
  → DetectedBankTransaction (PENDING_REVIEW)
  → bandeja /movimientos/detectados
  → usuario confirma → Transaction real (transacción atómica) + AuditLog
```

## Módulos backend

- `email-sources`: CRUD de correos conectados, generación/hash/regeneración/revocación de token.
- `email-ingestion`: endpoint público autenticado por token (`IngestionGuard`), test, dedup, orquestación.
- `bank-email-parsers`: interfaz + parsers BCP/Interbank/BBVA + genérico, confianza, fingerprint, normalización de comercio.
- `detected-transactions`: bandeja, filtros, confirmar (→ Transaction), ignorar, marcar duplicado, bulk.
- `reconciliation-rules`: reglas por comercio/banco/tarjeta que sugieren destino.

## Seguridad

- Token de ingesta: 32 bytes aleatorios, prefijo `kp_ing_`, se guarda solo el hash SHA-256.
- El token se muestra una sola vez; se puede regenerar y revocar.
- No se guarda contraseña de Gmail ni tokens de Google.
- No se almacena el cuerpo completo del correo; solo campos parseados + `rawDataSanitized`
  (con la tarjeta enmascarada `****4589`).
- El endpoint de ingesta no usa el JWT del usuario; se autentica solo por el token de la fuente.

## Deduplicación

- **Nivel 1 (mensaje)**: único por `emailSourceId + providerMessageId`. Un reenvío del mismo
  correo responde `duplicate` con HTTP 200 (para que Apps Script lo marque procesado).
- **Nivel 2 (operación)**: `fingerprint = sha256(bank + last4 + comercio + monto + moneda +
  fecha redondeada al minuto + referencia)`. Si ya existe un detectado con ese fingerprint
  (en cualquier correo del usuario), el nuevo se marca `DUPLICATE` y no crea gasto.

## Tipos de operación

`CARD_PURCHASE`, `ONLINE_PURCHASE`, `CASH_WITHDRAWAL`, `TRANSFER_SENT`, `TRANSFER_RECEIVED`,
`SERVICE_PAYMENT`, `SUBSCRIPTION`, `REFUND`, `REVERSAL`, `DECLINED_TRANSACTION`,
`INSTALLMENT_PURCHASE`. Las operaciones `DECLINED_TRANSACTION` no se pueden confirmar como
egreso. `REFUND`/`REVERSAL` se registran como ingreso al confirmar.

## Desarrollo local

Apps Script no puede llamar a `localhost`. Para probar sin túnel, usa fixtures:

```
# 1. Crea una fuente de correo en la UI y copia su token
export KORAPAY_INGESTION_TOKEN=kp_ing_...
# 2. Inyecta un correo de ejemplo
pnpm --filter @korapay/api email:ingest:fixture bcp
pnpm --filter @korapay/api email:ingest:fixture interbank
```

En producción (Fly.io) el Apps Script usa la URL HTTPS pública.

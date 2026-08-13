# Informe de Auditoria de Codigo -- KoraPay

**Fecha:** 2026-08-11
**Proyecto:** KoraPay (Mi Bolsillito)
**Metodologia:** Code review basado en `code-standards` y `architecture-guard` skills
**Alcance:** `apps/api/src`, `apps/web/src`, `packages/domain/src`, `prisma/`

---

## Resumen Ejecutivo

Se examinaron **~140 archivos fuente**. El proyecto tiene una estructura modular NestJS estandar (no hexagonal). Se encontraron violaciones en todas las categorias analizadas. Las mas graves son:

1. **Ausencia total de arquitectura hexagonal** en el backend: cada modulo es plano (controller/service/dto/module), sin separacion domain/application/infrastructure.
2. **15 archivos exceden 500 lineas** (regla absoluta #3 de code-standards), algunos dramaticamente (`parsers.ts`: 1.3K+, `detected-transactions.service.ts`: 1113, `talentos/[id]/page.tsx`: 1091, `prisma/schema.prisma`: 1005).
3. **Uso sistematico de `as never` y `as any`** (33+ ocurrencias) para silenciar TypeScript en vez de tipar correctamente.
4. **`Record<string, unknown>` ubiquitario** (42+ ocurrencias) reemplazando DTOs tipados en updates.

---

## 1. Arquitectura Hexagonal -- CAPAS ROTAS [CRITICAL]

### 1.1 Backend: Sin separacion de capas [CRITICAL]

**Regla violada:** `architecture-guard` -- Backend NestJS debe tener `domain/`, `application/`, `infrastructure/`, `interface/` por modulo.

**Archivos afectados:** TODOS los modulos en `apps/api/src/modules/*/`

Ejemplos concretos:

| Archivo | Problema |
|---|---|
| `apps/api/src/modules/transaction/transaction.service.ts:1-522` | Logica de negocio + queries Prisma + calculos de dominio + orquestacion, todo en un solo archivo de 522 lineas |
| `apps/api/src/modules/reports/reports.service.ts:1-729` | 729 lineas con queries SQL + calculos financieros + logica de presentacion |
| `apps/api/src/modules/debt/debt.service.ts:1-156` | Calculos de balance (`totalPaid`, `balance`) en el servicio en vez de en dominio |
| `apps/api/src/modules/detected-transactions/detected-transactions.service.ts:1-187` | 1113 lineas: validacion de negocio + queries + reglas de confirmacion |
| `apps/api/src/modules/talent/talent.service.ts:1-943` | 943 lineas: calculos financieros complejos (report(), globalReport()) en servicio NestJS |
| `apps/api/src/modules/catalog/catalog.service.ts:1-290` | 638 lineas mezclando CRUD de 6 recursos distintos en un solo servicio |

**Propuesta de correccion:**
```
src/modules/transaction/
  domain/
    transaction.entity.ts
    transaction.repository.interface.ts
  application/
    create-transaction.use-case.ts
    list-transactions.use-case.ts
    monthly-summary.use-case.ts
  infrastructure/
    drizzle-transaction.repository.ts
  interface/
    transaction.controller.ts (ya existe, mover aqui)
    transaction.dto.ts (ya existe, mover aqui)
```

---

## 2. Archivos que Exceden 500 Lineas [HIGH]

**Regla violada:** `code-standards` Regla #3 absoluta -- "Ningun archivo puede superar 500 lineas."

### API (Backend)

| Archivo | Lineas | Accion requerida |
|---|---|---|
| `apps/api/src/modules/bank-email-parsers/parsers.ts` | ~1,300+ | Extraer parsers por banco a archivos individuales |
| `apps/api/src/modules/detected-transactions/detected-transactions.service.ts` | 1,113 | Dividir en use cases: ConfirmDetectedUseCase, ListDetectedUseCase, etc. |
| `apps/api/src/modules/debt/debt.service.ts` | 998 | Dividir debt + debt-payment en servicios separados |
| `apps/api/src/modules/talent/talent.service.ts` | 943 | Extraer report() y globalReport() a TalentReportService |
| `apps/api/src/modules/talent-portal/talent-portal.service.ts` | 943 | Refactorizar |
| `apps/api/src/modules/bank-email-parsers/bank-email-parsers.service.ts` | ~1,300+ | Dividir |
| `apps/api/src/modules/email-sources/email-sources.service.ts` | 766 | Extraer token management a servicio separado |
| `apps/api/src/modules/reports/reports.service.ts` | 729 | Separar personal/employment/business en servicios distintos |
| `apps/api/src/modules/email-ingestion/email-ingestion.service.ts` | 692 | Extraer fingerprinting + dedup a servicios separados |
| `apps/api/src/modules/catalog/catalog.service.ts` | 638 | Un recurso = un servicio (ApplicationService, ProjectService, etc.) |
| `apps/api/src/modules/reports/employment-breakdown.ts` | 559 | Dividir funciones exportadas en modulos |
| `apps/api/src/modules/talent-ledger/talent-ledger.service.ts` | 527 | Extraer summary + audit a servicios separados |
| `apps/api/src/modules/transaction/transaction.service.ts` | 522 | Separar CRUD + monthlySummary + recurrence |

### Web (Frontend)

| Archivo | Lineas | Accion requerida |
|---|---|---|
| `apps/web/src/app/(app)/mimotech/talentos/[id]/page.tsx` | 1,091 | Extraer secciones (ContractsSection, LedgerSection, ReportSection) a componentes |
| `apps/web/src/components/forms/transaction-form-dialog.tsx` | 642 | Dividir en sub-componentes: BasicInfoSection, RecurrenceSection, BusinessFields |
| `apps/web/src/app/(app)/deudas/page.tsx` | 597 | Extraer DebtFormDialog y PaymentFormDialog a archivos separados |
| `apps/web/src/app/(app)/mimotech/costos/page.tsx` | 526 | Extraer logica de filtros + tabla a hooks y componentes |
| `apps/web/src/app/(app)/mimotech/talentos/page.tsx` | 527 | Refactorizar |
| `apps/web/src/app/(app)/movimientos/detectados/page.tsx` | 523 | Refactorizar |
| `apps/web/src/app/(app)/mimotech/talentos/reporte/page.tsx` | 522 | Refactorizar |
| `apps/web/src/lib/api.types.ts` | 755 | Dividir en `transaction.types.ts`, `talent.types.ts`, `detected.types.ts`, etc. |

### Prisma

| Archivo | Lineas | Accion requerida |
|---|---|---|
| `prisma/schema.prisma` | 1,005 | Usar `prismaSchemaFolder` (multi-file schema) para dividir por dominio |
| `prisma/seed.ts` | 918 | Dividir en seeders por dominio |

---

## 3. TypeScript Anti-Patrones [HIGH]

> **Estado 2026-08-12 — RESUELTO.** Los tres puntos corregidos modulo por modulo.
> Resultado en codigo de produccion: `as never` 25 -> **0**, `as any` 7 -> **0**,
> `data: Record<string, unknown>` en updates -> **0**. Quedan 11 casts solo en
> archivos `.spec.ts` (mocks de test), que es su uso legitimo.
>
> **Como se hizo:** cada `update()` recibe ahora su DTO real (`UpdateCategoryDto`,
> `UpdateDebtDto`, …) — ya existian y estaban validados por `class-validator`, solo
> que el servicio descartaba el tipo. Donde habia transformacion (fechas, relaciones,
> columnas JSON) se uso el tipo de Prisma correspondiente:
> `Prisma.DebtUpdateInput`, `Prisma.CompanyUpdateInput`, `Prisma.InputJsonObject`.
>
> **Dos bugs reales que el tipado descubrio:**
> 1. `talent.service.ts` — el mapeo podia escribir `null` en `status`, que **no es
>    nullable** en el esquema (tiene default `ACTIVE`). Enviar `status: ''` habria
>    fallado en base de datos. Ahora `name` y `status` solo se escriben si traen valor.
> 2. `company.service.ts` — `globalCompanyId` se asignaba como escalar; al tipar se
>    migro a `connect`/`disconnect`, que es la forma correcta para una relacion.
>
> **Efecto colateral positivo:** en `transaction.service.ts` desaparecieron 26
> `as string` que ya no hacian falta al tipar el parametro.
>
> **Verificacion:** 37 tests pasan (2 estaban rotos desde el refactor de hardcodeos,
> por mocks desactualizados de `DECOLECTA_API_URL`/`TIMEOUT_MS`; se corrigieron).
> Ademas se probo el CRUD real contra la BD en 7 modulos (26 comprobaciones, sin
> fallos) y se confirmo que los datos no se contaminaron: 28 costos, 81 pagos,
> 100 ingresos de talentos, 9 talentos, 210 ingresos laborales por S/1,002,216.19.

### 3.1 `as never` -- 25 ocurrencias [HIGH]

**Regla violada:** `code-standards` -- `as never` es un escape de tipos que oculta errores.

**Archivos y lineas:**

| Archivo | Linea(s) | Codigo |
|---|---|---|
| `catalog.service.ts` | 44, 77, 161, 288 | `data: data as never` |
| `detected-transactions.service.ts` | 66 | `data: data as never` |
| `email-ingestion.service.ts` | 152 | `sanitizeRaw(...) as never` |
| `email-sources.service.ts` | 94 | `data: data as never` |
| `reconciliation-rules.service.ts` | 16, 22 | `data: { ...data, profileId } as never` |
| `talent.service.ts` | 645, 655, 727, 818 | `data: ... as never` |
| `client.service.ts` | 50 | `data: data as never` |
| `company.service.ts` | 63 | `data: updateData as never` |

**Propuesta:** Crear tipos de update especificos para cada entidad (ej. `ApplicationUpdateInput`) o usar `Prisma.ApplicationUpdateInput` en vez de `Record<string, unknown>`.

### 3.2 `as any` -- 8 ocurrencias [HIGH]

| Archivo | Linea | Codigo |
|---|---|---|
| `account.service.ts` | 61 | `data: data as any` |
| `audit.service.ts` | 17 | `changes: params.changes as any` |
| `category.service.ts` | 30 | `data: data as any` |
| `debt.service.ts` | 65 | `data: updateData as any` |
| `pending-item.service.ts` | 31 | `data: data as any` |
| `person.service.ts` | 40 | `data: data as any` |
| `saving-goal.service.ts` | 51 | `data: data as any` |

### 3.3 `Record<string, unknown>` en updates -- 36+ ocurrencias [MEDIUM]

Todos los metodos `update()` del backend reciben `data: Record<string, unknown>` en vez de un DTO tipado. Esto anula la validacion de TypeScript y permite enviar campos inexistentes.

```typescript
// PROHIBIDO -- actual en el codigo
async update(id: string, workspaceId: string, data: Record<string, unknown>) {
  return this.prisma.debt.update({ where: { id }, data: updateData as any });
}

// CORRECTO
async update(id: string, workspaceId: string, data: UpdateDebtDto) {
  return this.prisma.debt.update({ where: { id }, data });
}
```

---

## 4. Hardcodeos y Strings Magicos [MEDIUM]

### 4.1 URL hardcodeada [LOW]

| Archivo | Linea | Codigo |
|---|---|---|
| `exchange-rate.service.spec.ts` | 34 | `'https://api.decolecta.com'` |

> **Estado 2026-08-11 — NO es un hallazgo.** Ese valor es el default de un mock de
> test (`config.get` simulado), no configuracion de produccion. El servicio real ya
> exige `DECOLECTA_API_URL` y lanza `ServiceUnavailableException` si falta.

### 4.2 Strings magicos en servicios [MEDIUM]

| Archivo | Linea(s) | Codigo |
|---|---|---|
| `detected-transactions.service.ts` | 3-4 | `'DECLINED_TRANSACTION'`, `'REFUND'`, `'REVERSAL'` -- constantes locales pero no en dominio |
| `transaction.service.ts` | 6 | `MAX_OCCURRENCES = 120` definido como constante local de archivo |
| `scheduled-tasks.service.ts` | 4-5 | `'0 8 * * *'`, `'5 0 * * *'`, `'America/Lima'` -- deberian ser configuracion |
| `email-ingestion.service.ts` | 11 | `EMAIL_INGESTION_MAX_BODY_LENGTH` viene de `@korapay/domain` (correcto) |
| `talent.service.ts` | 26 | `'NUNCA_PAGO'`, `'NUNCA PAGO'` -- inconsistencia con/sin guion bajo |

> **Estado 2026-08-11 — corregido en parte:**
>
> - `detected-transactions.service.ts`: `BLOCKED_TYPES` era identico a
>   `NON_CONFIRMABLE_TYPES` del dominio (misma regla que aplica el frontend para
>   deshabilitar el boton). Ahora lo importa. La otra lista se renombro a
>   `INCOME_LIKE_TYPES`: **no** es equivalente a `NON_EXPENSE_TYPES` del dominio,
>   que ademas incluye `DECLINED_TRANSACTION`. Unificarlas habria sido un bug.
> - `talent.service.ts`: la doble forma es intencional, no un descuido — el Excel
>   escribia `NUNCA PAGO` con espacio y el formulario guarda `NUNCA_PAGO`.
>   Extraido a `isNeverPaid()` en `@korapay/domain`, usado en los 2 sitios.
>   Verificado en BD: 0 registros con la forma con espacio (el seed los mapea a
>   `OVERDUE` via `mapExcelStatus`).
> - `MAX_OCCURRENCES`, los cron y `America/Lima` siguen como constantes locales:
>   son decisiones de configuracion, no duplicacion. Pendiente de decidir si van a
>   `.env`.

### 4.3 Status codes hardcodeados [MEDIUM]

Multiples servicios usan strings como `'PENDING'`, `'PAID'`, `'PENDING_REVIEW'`, `'CONFIRMED'`, `'DUPLICATE'` dispersos sin referencia a un enum de dominio.

---

## 5. Duplicacion de Codigo [HIGH]

### 5.1 Patron de soft-delete duplicado [HIGH]

**Archivos:** `account.service.ts`, `category.service.ts`, `client.service.ts`, `company.service.ts`, `debt.service.ts`, `pending-item.service.ts`, `person.service.ts`, `saving-goal.service.ts`, `talent.service.ts`

Todos implementan el mismo patron:
```typescript
async remove(id: string, workspaceId: string) {
  const found = await this.prisma.X.findFirst({ where: { id, workspaceId, deletedAt: null } });
  if (!found) throw new NotFoundException('X not found');
  return this.prisma.X.update({ where: { id }, data: { deletedAt: new Date() } });
}
```

**Propuesta:** Crear un `SoftDeleteService` generico o un mixin reutilizable.

### 5.2 Patron de update con verificacion de duplicado [HIGH]

`catalog.service.ts` repite el patron "buscar duplicado por nombre case-insensitive + lanzar ConflictException" para Application, Project, PaymentMethod, etc.

**Propuesta:** Funcion helper `checkUniqueName(prisma, model, name, workspaceId, excludeId?)`.

### 5.3 Duplicacion de mapeo Decimal -> string [MEDIUM]

Converion repetida `new Decimal(x).toFixed(2)` aparece en reports, debt, talent, saving-balance, etc. sin un helper compartido.

### 5.4 Serializacion repetida de montos [LOW]

Multiples servicios repiten:
```typescript
return { ...row, amount: row.amount.toString(), amountBase: row.amountBase.toString() };
```

---

## 6. Malas Practicas React/Next [HIGH]

### 6.1 `apiFetch` usado directamente en componentes [HIGH]

**Regla violada:** `architecture-guard` -- "Los componentes NO llaman `fetch` directamente -- todo pasa por hooks -> use case -> repositorio"

**60+ ocurrencias** de `apiFetch()` en componentes y paginas. Ejemplos:

| Archivo | Contexto |
|---|---|
| `ahorros/page.tsx:61` | `apiFetch(...)` directo en `mutationFn` |
| `deudas/page.tsx:111` | `apiFetch(...)` directo en form submit |
| `talentos/[id]/page.tsx:112` | `apiFetch('/talent-ledger', ...)` directo en componente |
| `detectados/page.tsx:99` | `apiFetch(...)` directo en `useMutation` |

Aunque usan TanStack Query (con `useQuery`/`useMutation`), las llamadas `apiFetch` estan inline en los componentes. Deberian estar encapsuladas en repositorios de infraestructura.

### 6.2 `useEffect` para reset de formularios [LOW]

47 ocurrencias de `useEffect`, mayormente para `reset()` de formularios cuando cambia `open` o `transaction`. Patron aceptable pero no ideal -- considerar `key` prop en Dialog.

### 6.3 Ausencia de separacion de capas en frontend [HIGH]

**Regla violada:** `architecture-guard` -- Next.js debe tener `domain/`, `application/`, `infrastructure/`, `presentation/`.

El proyecto web tiene estructura plana:
```
src/
  app/         -> paginas
  components/  -> componentes
  lib/         -> utilidades + api client
```

No existe `domain/`, `application/`, ni `infrastructure/`. Todo es `presentation` (componentes con fetch directo) y `lib` (utilidades sueltas).

---

## 7. Malas Practicas NestJS [HIGH]

### 7.1 Servicios con demasiadas responsabilidades [HIGH]

| Servicio | Responsabilidades mezcladas |
|---|---|
| `CatalogService` (638 lineas) | CRUD de Applications + Projects + EmploymentContracts + PaymentMethods + Banks |
| `ReportsService` (729 lineas) | Reportes personales + empleo + business + company durations |
| `TalentService` (943 lineas) | CRUD talentos + reportes individuales + reportes globales + contratos + distribuciones + tokens |
| `TransactionService` (522 lineas) | CRUD + monthlySummary + recurrenceOccurrences + duplicate + changeStatus + transfer |

**Propuesta:** Un recurso = un servicio. `CatalogService` debe dividirse en 5 servicios independientes.

### 7.2 Controladores limpios [OK]

Los controladores son mayormente delgados. Solo orquestan request -> servicio -> response. **Sin violaciones significativas.**

### 7.3 DTOs con `@nestjs/swagger` correctos [OK]

Los DTOs existen y usan `class-validator` y `@ApiProperty`. **Sin violaciones significativas.**

### 7.4 `fetch()` nativo en NestJS [MEDIUM]

`exchange-rate.service.ts:96` usa `fetch()` nativo en vez de `HttpService` de NestJS (`@nestjs/axios`). En tests funciona, pero en produccion carece de interceptors, timeout configuration, y retry integrado.

> **Estado 2026-08-12 — corregido el fondo, sin migrar a axios.**
>
> De los tres problemas listados, uno no existia: **el timeout ya estaba** via
> `AbortSignal.timeout(DECOLECTA_TIMEOUT_MS)`. El **retry** si faltaba y se agrego.
>
> No se migro a `@nestjs/axios` porque **no esta instalado** y hay **una sola**
> llamada HTTP saliente en todo el backend. Sumar dos dependencias
> (`@nestjs/axios` + `axios`) y un envoltorio de RxJS para un unico `fetch` no se
> justifica; `fetch` nativo esta soportado desde Node 18. Si en el futuro aparecen
> mas integraciones externas, ahi si conviene centralizarlas en `HttpService`.
>
> El retry reintenta **3 veces con backoff lineal** (500ms, 1s) solo ante fallos
> transitorios — red, timeout, `5xx` o `429` — y **no** reintenta ante `4xx` de
> credenciales, que seria inutil y podria bloquear la cuenta. Si los 3 intentos
> fallan, se conserva la degradacion existente a la ultima tasa guardada.
>
> Cubierto por 2 tests nuevos: reintenta tras un `500` y tiene exito (2 llamadas);
> no reintenta ante `401` (1 llamada). Suite completa: 39 tests en verde.

---

## 8. Seguridad [MEDIUM]

### 8.1 Token de ingestion expuesto en respuesta [MEDIUM]

`email-sources.service.ts:87` -- `generateIngestionToken()` retorna el token en texto plano al frontend:
```typescript
return { source: serialize(source), ingestionToken: token };
```
Este token se usa para autenticar ingestion de correos. Si el log de respuesta no se sanitiza, el token queda registrado.

### 8.2 `randomBytes` sin opciones criptograficas explicitas [LOW]

`talent.service.ts:1` importa `randomBytes` de `node:crypto` pero no es un problema real -- es correcto. El token de 24 bytes es suficiente.

> **Estado 2026-08-12:** confirmado, sin accion. El propio hallazgo dice que es
> correcto; se deja documentado para no volver a revisarlo.

### 8.3 Sin rate limiting visible [MEDIUM]

No se detectaron guards de rate limiting en los controladores. Endpoints como `/email-ingestion` y `/auth` deberian tener `ThrottlerGuard`.

> **Estado 2026-08-12 — el hallazgo estaba equivocado, pero el fondo era valido.**
>
> `ThrottlerGuard` **ya estaba** registrado como `APP_GUARD` global en
> `app.module.ts:73`, con `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])`.
> Aplica a todos los controladores, por eso no aparece en ninguno. Verificado en
> caliente: peticion 101 devuelve `429`.
>
> No existe modulo `/auth` en este backend (no hay login: la ingesta se autentica
> por token con `IngestionGuard`).
>
> **Lo que si faltaba:** `/email-ingestion` es publico y su guard consulta la BD en
> cada intento *antes* de validar el token, asi que 100 intentos/min permitian
> tantear tokens de forma barata. Se le puso un limite propio de **20/min** con
> `@Throttle`. Verificado: 20 respuestas normales y luego `429`; el resto de
> endpoints conserva el limite global (30 peticiones a `/banks` sin bloqueo).

### 8.4 API key en ConfigService [OK]

`exchange-rate.service.ts:89-90` usa `ConfigService` para obtener `DECOLECTA_API_KEY`. Correcto.

---

## 9. Code Standards -- Otras Violaciones [MEDIUM/LOW]

### 9.1 Comentarios decorativos [LOW]

Se encontraron algunos comentarios descriptivos de lo obvio:

| Archivo | Linea | Comentario |
|---|---|---|
| `reports.service.ts` | ~115 | `// 1. Gastos por categoria` -- obvio por el codigo |
| `reports.service.ts` | ~128 | `// 2. Ingresos vs egresos por mes` |
| `reports.service.ts` | ~147 | `// 3. Evolucion de ahorros por mes` |
| `reports.service.ts` | ~162 | `// 4. Gasto fijo vs no fijo` |
| `talent.service.ts` | ~650 | `// Los costos de MIMOTECH se clasifican por...` |
| `transaction-form-dialog.tsx` | 127 | `// Medios de pago y bancos comparten el campo tags` |
| `transaction-form-dialog.tsx` | 187 | `// En ingresos laborales la repeticion la define el contrato...` |
| `transaction-form-dialog.tsx` | 191-192 | `// Los costos de MIMOTECH se clasifican por...` |

> **Estado 2026-08-12 — corregido en parte; el resto son falsos positivos.**
>
> La regla de `code-standards` dice: *"NUNCA agregar comentarios que expliquen lo
> obvio. Solo comentar logica genuinamente no obvia"*, y admite explicitamente
> comentarios que expliquen **POR QUE** (no QUE). Los 8 hallazgos no son iguales:
>
> **Eliminados (4):** los rotulos numerados de `reports.service.ts` (`// 1. Gastos
> por categoria`, `// 2.`, `// 3.`) solo repetian el nombre de la variable que venia
> justo debajo (`byCategory`, `incomeVsExpense`, `savingsEvolution`). El `// 4.` se
> reescribio conservando el unico dato no evidente: que la clasificacion fijo/no fijo
> sale de un **tag heredado del Excel**, no de un campo de la tabla.
>
> **Conservados (4):** documentan decisiones que no se deducen leyendo el codigo.
> Ejemplos: `contractDrivenIncome = showCompany` es ilegible sin la explicacion de
> que en ingresos laborales la repeticion la define el contrato; el guard
> `catalogsReady` existe por un bug real (sin catalogos, `splitTags` borraba los tags
> al guardar); y en `talent.service.ts` el comentario evita que alguien vuelva a
> meter `name`/`status` en el bucle que asigna `null`, lo que romperia el insert
> porque **no son anulables** en el esquema.

### 9.2 Emojis en codigo [OK]

No se encontraron emojis en el codigo fuente. **Sin violaciones.** (El campo `emoji` en el modelo de datos es un string de contenido, no un emoji literal en codigo.)

### 9.3 Gradientes CSS [OK]

`globals.css` no contiene gradientes. **Sin violaciones.**

### 9.4 `window.location.reload` / `router.refresh` [OK]

No se encontraron usos de recarga de pagina. **Sin violaciones.**

### 9.5 Barrel files [LOW]

`packages/domain/src/index.ts` y `packages/ui/src/index.ts` son barrel files. Segun `code-standards` de `CLAUDE.md`: "No barrel files (`index.ts` re-exports)." Pero estos son packages compartidos, no modulos de app.

> **Estado 2026-08-12 — no es un hallazgo; sin accion.** El propio texto ya lo
> matiza, y al verificarlo se confirma:
>
> - Esos dos `index.ts` **son el punto de entrada declarado** de cada paquete
>   (`"main": "./dist/index.js"` en domain, `"./src/index.ts"` en ui). No son
>   re-exports por comodidad: son el contrato publico del paquete. Eliminarlos
>   romperia los **99 sitios** que importan (`@korapay/domain` en 62 archivos,
>   `@korapay/ui` en 37) y dejaria los paquetes sin entrada valida.
> - La regla apunta a barrels **dentro de los modulos de la app**, que ocultan
>   dependencias y crean ciclos. Verificado con `find apps -name index.ts`:
>   **cero** barrels dentro de `apps/`. La regla ya se cumple donde aplica.

---

## 10. Duplicacion Adicional [MEDIUM]

### 10.1 `MONTH_NAMES` duplicado [MEDIUM]

- `apps/api/src/common/constants/months.ts` -- array de meses en backend
- `apps/web/src/lib/months.ts` -- mismo array en frontend
- Deberia vivir en `@korapay/domain`

### 10.2 Constantes de status duplicadas [MEDIUM]

`detected.constants.ts`, `peru-laboral-constants.ts`, `report-constants.ts` definen constantes que parcialmente replican definiciones del backend.

---

## 11. Resumen por Severidad

| Severidad | Cantidad | Categoria principal |
|---|---|---|
| **CRITICAL** | 1 | Arquitectura hexagonal ausente (todo el backend) |
| **HIGH** | ~45 | Archivos >500L (15), `as never`/`as any` (33), `Record<string, unknown>` (42), duplicacion CRUD, servicios sobrecargados |
| **MEDIUM** | ~20 | `fetch()` nativo, falta rate limiting, token en respuesta, strings magicos, constantes duplicadas, barrel files |
| **LOW** | ~15 | Comentarios decorativos, `useEffect` para reset, `MONTH_NAMES` duplicado |

---

## 12. Recomendaciones Priorizadas

1. **Refactorizar arquitectura del backend** a hexagonal (CRITICAL, largo plazo). Mientras tanto, al menos dividir servicios >500L.
2. **Dividir archivos >500 lineas** (15 archivos, HIGH, inmediato).
3. **Eliminar `as never` y `as any`** -- crear tipos de update correctos (HIGH, inmediato).
4. **Crear capas en frontend** -- mover `apiFetch` a repositorios en `infrastructure/` (HIGH).
5. **Extraer logica duplicada** -- soft-delete helper, unique-name checker, Decimal serializer (HIGH).
6. **Dividir servicios monoliticos** -- CatalogService, ReportsService, TalentService (MEDIUM).
7. **Agregar rate limiting** a endpoints sensibles (MEDIUM).
8. **Mover `MONTH_NAMES` y constantes compartidas** a `@korapay/domain` (LOW).

---

> **Review Summary:** Se examinaron ~140 archivos. Encontrados: 1 CRITICAL, ~45 HIGH, ~20 MEDIUM, ~15 LOW.
> **Top priority:** Refactorizar los 15 archivos que exceden 500 lineas y eliminar `as never`/`as any`/`Record<string, unknown>` que anulan el type safety.
> **Merge recommendation:** **APPROVE WITH SUGGESTIONS** -- El proyecto es funcional y mayormente bien estructurado para un MVP, pero la deuda tecnica en arquitectura y tipos crecera exponencialmente si no se aborda pronto.

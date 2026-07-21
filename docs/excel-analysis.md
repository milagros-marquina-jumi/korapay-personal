# Análisis del Excel de administración (KoraPay.xlsx)

Documento de referencia: mapea cada hoja del Excel original al módulo de KoraPay que la
reemplaza, sus campos y cómo se modela. Fuente de verdad: `prisma/data/*.json`
(exportado por `prisma/data/build.py`) sembrado por `prisma/seed.ts`.

## Resumen de hojas

| Hoja Excel | Filas | Workspace | Módulo KoraPay | Modelo |
|---|---|---|---|---|
| Menús | catálogos | (global) | Configuración → Catálogos | Category, Company, PaymentMethod, Bank, Currency |
| IngresosM_Trabajos | 210 | Ingresos Laborales | Ingresos | Transaction (INCOME) |
| IngresosM_Empresas | 172 | Ingresos Laborales | Empresas + Contratos | Company, Client, EmploymentContract |
| IngresosM_Reporte | 5 | Ingresos Laborales | Renta anual | TaxObligation + TaxObligationInstallment |
| EgresosM_Personal | 307 | Personal | Movimientos (egresos) | Transaction (EXPENSE) |
| InicioAhorroM | 299 | Personal | Ahorros | SavingBalance |
| Mimotech_Costos | 28 | MIMOTECH | Costos | Transaction (BUSINESS_COST) |
| Mimotech_Pagos | 81 | MIMOTECH | Pagos equipo | Transaction (TEAM_PAYMENT) |
| Mimotalents_General | 9 | MIMOTECH | Talentos | TalentProfile |
| Mimotalents_Ingresos | 100 | MIMOTECH | Talentos → contratos/distribución | TalentContract, TalentIncomeDistribution |
| Mimotalents_Egresos | 151 | MIMOTECH | Talentos → estado de cuenta | TalentLedgerEntry |

---

## Detalle por hoja

### Menús (catálogos)
Listas maestras: `empresas`, `medios_pago`, `monedas`, `tipo_pagos`, `tipos_movimiento`,
`categorias_ingreso`, `categorias_gasto`, `categorias_fijos`, `meses`, `anios`,
`personas_mimotech`, `suscripciones`.
→ Se reparten a los catálogos globales (medios de pago, bancos, monedas) y a los catálogos
por workspace (categorías, empresas). `medios_pago` es una columna mezclada banco+medio;
se clasifica con `isBank()` para separar Bancos de Medios de pago.

### IngresosM_Trabajos → Ingresos
Campos: fecha, anio, nMes, mes, trimestre, tipo, concepto, empresa, pago (Planilla/RxH/…),
moneda, totalSoles, totalDolar, **totalNeto**, pagoEn, numeroCuenta, estado.
→ `Transaction` tipo INCOME en el workspace Ingresos Laborales. `concepto`→categoría,
`empresa`→Company, `pago`→tag, `estado`→status. El neto alimenta el reporte por mes.

### IngresosM_Empresas → Empresas + Contratos
Campos: fecha, anio, nMes, mes, **empresaOficial**, **empresas**, empresasXMes,
fechaInicio, fechaFin.
→ `empresaOficial` = empleador (Company); `empresas` distinto = cliente final (Client,
ej. TADCON via ZUTUN, LLATAN 1/2). Las fechas inicio/fin pueblan Company.startDate/endDate
y generan EmploymentContract.

### IngresosM_Reporte (bloque Renta) → Renta anual
Campos: anio, monto, estado, detalles (ej. "12 cuotas FIN: 30/06/2026").
→ `TaxObligation` con `installments` parseado de "N cuotas" y `dueDate` de "FIN: dd/mm/yyyy".
Cada cuota es un `TaxObligationInstallment`; al pagarla se crea un egreso en Personal.

### EgresosM_Personal → Movimientos (egresos)
Campos: fecha, anio, nMes, mes, tipo, **fijoNoFijo**, concepto, descripcion, monto, banco,
masDetalle, estado.
→ `Transaction` tipo EXPENSE en Personal. `fijoNoFijo`→tag (alimenta el reporte fijo vs
no fijo), `concepto`→categoría, `banco`→tag/medio.

### InicioAhorroM → Ahorros
Campos: fecha, anio, nMes, mes, **descripcion** (bucket: Ahorros BCP, Warda BCP, Chanchito
IBK dólar, Efectivo…), banco, moneda, monto, importeTotal.
→ `SavingBalance`: saldo mensual por cuenta/bucket. Vista de saldos por mes (soles + USD).

### Mimotech_Costos → Costos
Campos: fecha, aplicacion, proyecto, descripcion, numeroTarjetaCuenta, banco, moneda,
monto, importeTotal, estado.
→ `Transaction` tipo BUSINESS_COST. `aplicacion`→Application, `proyecto`→Project.

### Mimotech_Pagos → Pagos equipo
Campos: persona, salario, fecha, mes, estado, notas, monto.
→ `Transaction` tipo TEAM_PAYMENT. `persona`→Person (kind TEAM).

### Mimotalents_General → Talentos
Campos: nombre, inicioConmigo, tiempoConmigo, finConmigo, inicioPrimerTrabajo, diapositiva,
lugarEstudio, inicioEstudios/finEstudios, estado.
→ `TalentProfile` (datos generales del talento tercerizado).

### Mimotalents_Ingresos → Talentos (contratos + distribución)
Campos: nombre, fecha, empresa, cliente, cargo, sueldo, conDescuento, recibi, seQuedoCon,
estado, inicio, fin.
→ `TalentContract` + `TalentIncomeDistribution` (cuánto recibió el talento vs cuánto retuvo
MIMOTECH). Genera una Transaction INCOME por fila.

### Mimotalents_Egresos → Talentos (estado de cuenta)
Campos: nombre, fecha, anio, nMes, mes, tipoPago (Egreso/Deuda), **cantidadE** (pagado),
**cantidadD** (deuda), **faltaPagar**, descripcion, estado.
→ `TalentLedgerEntry`: ledger por talento con pagado/deuda/falta pagar y saldo.

---

## Cobertura de CRUD por módulo

| Módulo | Crear | Editar | Eliminar | Notas |
|---|---|---|---|---|
| Movimientos | ✓ | ✓ | ✓ | + duplicar, estado rápido, recurrencia |
| Ingresos | ✓ | ✓ | ✓ | + estado rápido, filtro año/mes, total |
| Renta anual | ✓ | ✓ | ✓ | + cuotas pagables (crea egreso Personal) |
| Ahorros | (vista saldos) | — | — | saldos mensuales por cuenta (snapshot) |
| Empresas | ✓ | ✓ | ✓ | + clientes por empresa, fechas |
| Contratos | ✓ | ✓ | ✓ | |
| Proyectos | ✓ | ✓ | ✓ | |
| Aplicaciones | ✓ | ✓ | ✓ | |
| Deudas | ✓ | ✓ | ✓ | |
| Pendientes | ✓ | ✓ | ✓ | |
| Talentos | ✓ | ✓ | ✓ | + ledger + portal por token |
| Catálogos (categorías, medios, bancos, monedas) | ✓ | ✓ | ✓ | Configuración |

## Reportes por workspace

- **Personal**: gastos por categoría, ingresos vs egresos por mes, evolución de ahorros,
  fijo vs no fijo.
- **Ingresos Laborales**: ingresos por empresa/mes (Resumen por mes), renta.
- **MIMOTECH**: costos por aplicación, utilidad, pagos de equipo, saldo de talentos.
- **Qoryx**: ingresos vs egresos por mes.

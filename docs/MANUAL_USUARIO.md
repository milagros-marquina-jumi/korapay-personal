# Manual de Usuario -- KoraPay

Version: 1.0
Fecha: 2026-08-12
Audiencia: Usuarios finales de todos los roles

---

## Indice

1. [Que es KoraPay](#1-que-es-korapay)
2. [Primeros pasos](#2-primeros-pasos)
   - 2.1. [Acceso al sistema](#21-acceso-al-sistema)
   - 2.2. [Pantalla de inicio de sesion](#22-pantalla-de-inicio-de-sesion)
3. [Navegacion general](#3-navegacion-general)
   - 3.1. [Barra lateral](#31-barra-lateral)
   - 3.2. [Selector de espacio de trabajo](#32-selector-de-espacio-de-trabajo)
4. [Dashboard](#4-dashboard)
5. [Movimientos](#5-movimientos)
   - 5.1. [Lista de movimientos](#51-lista-de-movimientos)
   - 5.2. [Crear un movimiento](#52-crear-un-movimiento)
   - 5.3. [Editar un movimiento](#53-editar-un-movimiento)
   - 5.4. [Tipos de movimiento](#54-tipos-de-movimiento)
   - 5.5. [Movimientos recurrentes](#55-movimientos-recurrentes)
   - 5.6. [Transferencias entre cuentas](#56-transferencias-entre-cuentas)
6. [Movimientos detectados](#6-movimientos-detectados)
   - 6.1. [Como funcionan los movimientos detectados](#61-como-funcionan-los-movimientos-detectados)
   - 6.2. [Confirmar un movimiento detectado](#62-confirmar-un-movimiento-detectado)
   - 6.3. [Ignorar un movimiento detectado](#63-ignorar-un-movimiento-detectado)
7. [Ingresos](#7-ingresos)
8. [Deudas](#8-deudas)
   - 8.1. [Registrar una deuda](#81-registrar-una-deuda)
   - 8.2. [Registrar un pago de deuda](#82-registrar-un-pago-de-deuda)
   - 8.3. [Tipos de direccion de deuda](#83-tipos-de-direccion-de-deuda)
9. [Ahorros](#9-ahorros)
   - 9.1. [Crear una meta de ahorro](#91-crear-una-meta-de-ahorro)
   - 9.2. [Registrar aportes a una meta](#92-registrar-aportes-a-una-meta)
10. [Pendientes](#10-pendientes)
11. [Empresas](#11-empresas)
12. [Proyectos](#12-proyectos)
13. [Contratos](#13-contratos)
14. [Aplicaciones](#14-aplicaciones)
15. [Perfil](#15-perfil)
16. [Configuracion](#16-configuracion)
    - 16.1. [Integraciones de correo](#161-integraciones-de-correo)
    - 16.2. [Reglas de conciliacion](#162-reglas-de-conciliacion)
17. [Reportes](#17-reportes)
18. [Renta](#18-renta)
19. [Modulo MIMOTECH](#19-modulo-mimotech)
    - 19.1. [Costos](#191-costos)
    - 19.2. [Talentos](#192-talentos)
    - 19.3. [Equipo](#193-equipo)
    - 19.4. [Reporte de talentos](#194-reporte-de-talentos)
20. [Portal de talentos (Mimotalents)](#20-portal-de-talentos-mimotalents)
21. [Obligaciones tributarias](#21-obligaciones-tributarias)
22. [Referencia de conceptos](#22-referencia-de-conceptos)
23. [Atajos de teclado](#23-atajos-de-teclado)

---

## 1. Que es KoraPay

KoraPay es una plataforma de gestion financiera personal y empresarial. Permite llevar el control completo de ingresos, egresos, deudas, ahorros y obligaciones tributarias desde un solo lugar.

Capacidades principales:

- Registrar y categorizar todos los movimientos financieros (ingresos y egresos).
- Gestionar multiples cuentas bancarias con saldos actualizados.
- Controlar deudas personales y profesionales con seguimiento de pagos.
- Establecer metas de ahorro y registrar aportes periodicos.
- Administrar talentos, contratos, distribucion de ingresos y costos empresariales.
- Detectar automaticamente transacciones desde correos electronicos bancarios.
- Generar reportes financieros por periodo, categoria, persona o proyecto.
- Registrar obligaciones tributarias con cuotas y fechas de vencimiento.

---

## 2. Primeros pasos

### 2.1. Acceso al sistema

KoraPay es una aplicacion web. Para acceder, abrir el navegador y dirigirse a la URL proporcionada por el administrador del sistema.

### 2.2. Pantalla de inicio de sesion

1. Ingresar el **correo electronico** registrado.
2. Ingresar la **contrasena**.
3. Hacer clic en el boton **Iniciar sesion**.

> Si no se recuerda la contrasena, contactar al administrador del sistema para restablecer el acceso.

---

## 3. Navegacion general

La interfaz de KoraPay se compone de tres areas principales:

- **Barra lateral izquierda**: Contiene el menu de navegacion con acceso a todos los modulos del sistema.
- **Selector de espacio de trabajo**: Ubicado en la parte superior de la barra lateral. Permite cambiar entre distintos espacios de trabajo (personales o empresariales).
- **Area de contenido**: Muestra la informacion del modulo seleccionado.

### 3.1. Barra lateral

La barra lateral agrupa los modulos en secciones:

| Seccion | Modulos |
|---|---|
| Principal | Dashboard, Movimientos, Movimientos detectados, Ingresos |
| Finanzas | Deudas, Ahorros, Pendientes |
| Negocio | Empresas, Proyectos, Contratos, Aplicaciones |
| MIMOTECH | Costos, Talentos, Equipo |
| Herramientas | Perfil, Configuracion, Reportes, Renta |

### 3.2. Selector de espacio de trabajo

Cada espacio de trabajo (tambien llamado "Bolsillito") es un entorno independiente con sus propios movimientos, cuentas, categorias y configuraciones.

- **Espacio personal**: Para finanzas personales.
- **Espacio empresarial**: Para finanzas de un negocio (ej. MIMOTECH). Incluye modulos adicionales como talentos, costos y obligaciones tributarias.

Para cambiar de espacio de trabajo, seleccionar el nombre en el selector superior de la barra lateral.

---

## 4. Dashboard

El Dashboard es la pantalla principal. Muestra un resumen financiero del espacio de trabajo activo.

Incluye:

- **Tarjetas KPI**: Ingresos, egresos, ahorros y saldo del periodo.
- **Grafico de ingresos vs egresos**: Evolucion mensual de los ultimos 12 meses.
- **Distribucion por categoria**: Grafico de anillos con los egresos agrupados por categoria (se muestra solo si hay categorias asignadas).
- **Ultimos movimientos**: Lista de las transacciones mas recientes.

> En espacios de tipo empresarial, el KPI de ingresos muestra el ingreso real de la empresa (lo que efectivamente recibe despues de distribuir a los talentos). El tooltip sobre cada tarjeta explica el calculo.

---

## 5. Movimientos

La pantalla de movimientos muestra todas las transacciones financieras registradas.

### 5.1. Lista de movimientos

La tabla principal muestra:

| Columna | Descripcion |
|---|---|
| Fecha | Fecha del movimiento |
| Concepto | Descripcion breve |
| Tipo | `Ingreso`, `Egreso`, `Costo empresarial`, `Pago a equipo`, `Transferencia` |
| Importe | Monto en la moneda base |
| Cuenta | Cuenta bancaria asociada |
| Categoria | Categoria asignada |
| Estado | `Pagado`, `Pendiente` |
| Persona / Empresa | Entidad vinculada si aplica |

Acciones disponibles desde la tabla:

- **Filtrar**: Por tipo, cuenta, categoria, persona, empresa, proyecto, aplicacion o rango de fechas.
- **Ordenar**: Por fecha, importe o concepto.
- **Buscar**: Por texto en el concepto o descripcion.

### 5.2. Crear un movimiento

1. Hacer clic en el boton **Nuevo movimiento**.
2. Seleccionar el **tipo** de movimiento.
3. Completar los campos obligatorios:
   - **Concepto**: Descripcion breve del movimiento (maximo 100 caracteres).
   - **Fecha**: Fecha en que ocurrio el movimiento.
   - **Importe**: Monto en la moneda original.
   - **Cuenta**: Cuenta bancaria de origen o destino.
4. Completar los campos opcionales segun corresponda:
   - **Descripcion**: Notas adicionales (maximo 300 caracteres).
   - **Categoria**: Clasificacion del movimiento.
   - **Persona**: Persona vinculada al movimiento.
   - **Empresa / Cliente**: Entidad empresarial vinculada.
   - **Proyecto**: Proyecto asociado.
   - **Aplicacion**: Aplicacion o servicio asociado.
   - **Moneda y tipo de cambio**: Si el movimiento no esta en la moneda base.
   - **Fecha de vencimiento y fecha de pago**: Para movimientos con estado `Pendiente` o `Pagado`.
5. Hacer clic en **Guardar**.

### 5.3. Editar un movimiento

1. Ubicar el movimiento en la tabla.
2. Hacer clic en el icono de edicion (lapiz).
3. Modificar los campos necesarios.
4. Hacer clic en **Guardar**.

### 5.4. Tipos de movimiento

| Tipo | Uso |
|---|---|
| `INCOME` | Ingreso de dinero (salario, venta, reembolso). |
| `EXPENSE` | Egreso o gasto (compra, servicio, suscripcion). |
| `BUSINESS_COST` | Costo operativo de la empresa. Solo visible en espacios empresariales. |
| `TEAM_PAYMENT` | Pago a un miembro del equipo. Solo visible en espacios empresariales. |
| `TRANSFER` | Transferencia entre cuentas propias. |

### 5.5. Movimientos recurrentes

Un movimiento puede marcarse como recurrente. Esto indica que se repite periodicamente.

Para crear un movimiento recurrente:

1. Al crear o editar un movimiento, activar la opcion **Es recurrente**.
2. Configurar la **frecuencia**: diaria, semanal, mensual o anual.
3. Definir el **intervalo** (ej. cada 2 meses).
4. Opcional: establecer una **fecha de fin** o un **numero maximo de ocurrencias**.

### 5.6. Transferencias entre cuentas

Para registrar una transferencia entre cuentas propias:

1. Seleccionar el tipo `TRANSFER`.
2. Elegir la **cuenta de origen**.
3. Elegir la **cuenta de destino**.
4. El sistema registrara un egreso en la cuenta origen y un ingreso en la cuenta destino.

---

## 6. Movimientos detectados

### 6.1. Como funcionan los movimientos detectados

KoraPay puede recibir correos electronicos de notificaciones bancarias y extraer automaticamente las transacciones. Estos movimientos aparecen en la bandeja de **Movimientos detectados** con estado `PENDING_REVIEW` para que el usuario los revise y confirme.

La deteccion automatica requiere:

1. Tener configurada una **integracion de correo** (ver [Integraciones de correo](#161-integraciones-de-correo)).
2. Opcional: tener **reglas de conciliacion** configuradas para asignar automaticamente cuenta, categoria y proyecto (ver [Reglas de conciliacion](#162-reglas-de-conciliacion)).

### 6.2. Confirmar un movimiento detectado

1. Ir a **Movimientos > Detectados**.
2. Revisar la lista de transacciones pendientes de revision.
3. Para cada movimiento, verificar los datos detectados: comercio, importe, fecha, banco, cuenta.
4. Hacer clic en **Confirmar** para convertir el movimiento detectado en un movimiento oficial.
5. Antes de confirmar se puede asignar o modificar: cuenta, categoria, proyecto o aplicacion.

> Una vez confirmado, el movimiento aparece en la pantalla principal de Movimientos y se descuenta del saldo de la cuenta seleccionada.

### 6.3. Ignorar un movimiento detectado

Si un movimiento detectado no es relevante:

1. Ubicar el movimiento en la lista de detectados.
2. Hacer clic en **Ignorar**.
3. El movimiento se marcara como ignorado y no aparecera en la lista principal.

---

## 7. Ingresos

La pantalla de Ingresos es un filtro predefinido de la pantalla de Movimientos que muestra solo transacciones de tipo `INCOME`. Funciona igual que la seccion de Movimientos pero limitada a ingresos.

Permite:

- Ver el historial completo de ingresos.
- Filtrar por cuenta, categoria, persona, empresa o rango de fechas.
- Crear, editar y eliminar ingresos con los mismos pasos descritos en [Movimientos](#5-movimientos).

---

## 8. Deudas

El modulo de deudas permite registrar y hacer seguimiento de deudas personales o profesionales.

### 8.1. Registrar una deuda

1. Ir a **Deudas**.
2. Hacer clic en **Nueva deuda**.
3. Completar los campos:
   - **Direccion**: `Debo` (el usuario debe dinero) o `Me deben` (un tercero debe al usuario).
   - **Concepto**: Descripcion de la deuda (maximo 150 caracteres).
   - **Importe original**: Monto total de la deuda.
   - **Persona**: Persona vinculada a la deuda (opcional).
   - **Tasa de interes**: Porcentaje de interes si aplica (opcional).
   - **Fecha de vencimiento**: Fecha limite de pago (opcional).
   - **Notas**: Informacion adicional (maximo 500 caracteres).
4. Hacer clic en **Guardar**.

La tabla de deudas muestra para cada una:

| Columna | Descripcion |
|---|---|
| Concepto | Descripcion de la deuda |
| Direccion | `Debo` o `Me deben` |
| Importe original | Monto total |
| Pagado | Suma de pagos realizados |
| Saldo | Importe original menos lo pagado |
| Estado | `Pendiente`, `Pagado` o `Vencido` |

### 8.2. Registrar un pago de deuda

1. Ubicar la deuda en la tabla.
2. Hacer clic en el boton de accion y seleccionar **Registrar pago**.
3. Ingresar el **importe** del pago.
4. Ingresar la **fecha** del pago.
5. Seleccionar el **metodo** de pago (opcional).
6. Agregar **notas** si es necesario (maximo 300 caracteres).
7. Hacer clic en **Guardar**.

El sistema actualizara automaticamente el saldo de la deuda.

### 8.3. Tipos de direccion de deuda

| Direccion | Significado |
|---|---|
| `DEBO` | El usuario debe ese dinero a un tercero. |
| `ME_DEBEN` | Un tercero debe ese dinero al usuario. |

---

## 9. Ahorros

El modulo de ahorros permite definir metas de ahorro y registrar aportes periodicos para alcanzarlas.

### 9.1. Crear una meta de ahorro

1. Ir a **Ahorros**.
2. Hacer clic en **Nueva meta**.
3. Completar los campos:
   - **Nombre**: Identificador de la meta (maximo 100 caracteres).
   - **Importe objetivo**: Monto total que se desea ahorrar.
   - **Fecha objetivo**: Fecha limite para alcanzar la meta (opcional).
   - **Recomendacion mensual**: Cuanto se sugiere ahorrar por mes (opcional, el sistema lo calcula si se define fecha objetivo).
   - **Notas**: Informacion adicional (maximo 300 caracteres).
4. Hacer clic en **Guardar**.

### 9.2. Registrar aportes a una meta

1. Ubicar la meta de ahorro en la tabla.
2. Hacer clic en **Agregar aporte**.
3. Ingresar el **importe**.
4. Seleccionar el **tipo**: `CONTRIBUTION` (aporte) o `WITHDRAWAL` (retiro).
5. Ingresar la **fecha**.
6. Agregar **notas** si es necesario (maximo 100 caracteres).
7. Hacer clic en **Guardar**.

El sistema mostrara el progreso hacia la meta.

---

## 10. Pendientes

La pantalla de Pendientes muestra partidas que requieren atencion o conciliacion. Son registros que no son movimientos formales todavia pero representan obligaciones o derechos.

Cada pendiente tiene:

- **Tipo**: Clasificacion del pendiente.
- **Concepto**: Descripcion.
- **Importe**: Monto involucrado.
- **Fecha de vencimiento**: Cuando debe resolverse.
- **Estado**: `Pendiente`, `En proceso` o `Resuelto`.

Para crear un pendiente:

1. Ir a **Pendientes**.
2. Hacer clic en **Nuevo pendiente**.
3. Completar los campos requeridos.
4. Hacer clic en **Guardar**.

---

## 11. Empresas

El modulo de Empresas permite administrar las empresas con las que se tiene relacion financiera (empleadores, clientes corporativos, proveedores).

Cada empresa puede tener:

- **Nombre** y **RUC**.
- **Industria** o rubro.
- **Fecha de inicio** y **fecha de fin** de la relacion.
- **Notas** adicionales (maximo 300 caracteres).
- **Clientes** asociados a la empresa.

Las empresas se vinculan a movimientos, contratos y distribuciones de ingreso de talentos.

---

## 12. Proyectos

El modulo de Proyectos permite organizar los movimientos financieros por proyecto.

Cada proyecto tiene:

- **Nombre**: Identificador del proyecto (maximo 100 caracteres).
- **Descripcion**: Detalle del alcance (maximo 150 caracteres).
- **Estado**: `Activo` o `Inactivo`.

Los proyectos se asignan a los movimientos para clasificar ingresos y egresos por proyecto.

---

## 13. Contratos

El modulo de Contratos permite registrar contratos de trabajo o servicios profesionales.

Cada contrato tiene:

- **Empresa**: Empresa empleadora o contratante.
- **Cargo o posicion**: Rol desempenado.
- **Tipo de contrato**: Ej. planilla, recibo por honorarios.
- **Salario**: Monto acordado.
- **Fechas**: Inicio y fin del contrato.
- **Estado**: `Activo`, `Finalizado` o `Suspendido`.

---

## 14. Aplicaciones

El modulo de Aplicaciones permite registrar aplicaciones y servicios digitales utilizados, junto con sus suscripciones.

Cada aplicacion tiene:

- **Nombre**: Identificador (maximo 50 caracteres).
- **Proveedor**: Empresa que ofrece el servicio.
- **Categoria**: Tipo de aplicacion (ej. hosting, diseno, productividad).
- **URL**: Enlace al servicio.

Para cada aplicacion se pueden registrar suscripciones con:

- **Plan**: Nombre del plan contratado.
- **Importe**: Costo de la suscripcion.
- **Ciclo de facturacion**: Mensual, anual, etc.
- **Proxima renovacion**: Fecha del siguiente cobro.
- **Estado**: `Activo`, `Cancelado` o `Suspendido`.

---

## 15. Perfil

La pantalla de Perfil permite ver y editar los datos personales del usuario:

- **Nombre**: Nombre visible en el sistema.
- **Correo electronico**: Direccion de correo asociada a la cuenta.
- **Avatar**: Imagen de perfil.
- **Moneda preferida**: Moneda base para mostrar importes (por defecto `PEN`).
- **Tema**: `Claro`, `Oscuro` o `Sistema` (sigue la preferencia del dispositivo).

---

## 16. Configuracion

### 16.1. Integraciones de correo

KoraPay puede conectarse a una cuenta de Gmail para recibir notificaciones bancarias y detectar transacciones automaticamente.

Para configurar una integracion de correo:

1. Ir a **Configuracion > Integraciones > Correo**.
2. Hacer clic en **Nueva fuente de correo**.
3. Completar:
   - **Nombre**: Identificador para esta fuente (maximo 50 caracteres).
   - **Correo electronico**: Direccion de Gmail a monitorear.
   - **Proveedor**: `GMAIL_APPS_SCRIPT` (unico disponible actualmente).
   - **Espacio de trabajo por defecto**: Donde se crearan los movimientos detectados.
   - **Cuenta por defecto**: Cuenta bancaria a asignar por defecto.
4. Hacer clic en **Generar token**.
5. Copiar el token generado y configurarlo en Google Apps Script siguiendo las instrucciones en pantalla.

> La configuracion de Google Apps Script requiere acceso tecnico. Solicitar asistencia al administrador del sistema si es necesario.

Estados posibles de una fuente de correo:

| Estado | Significado |
|---|---|
| `ACTIVE` | La fuente esta activa y recibiendo correos. |
| `REVOKED` | El token fue revocado y la fuente dejo de funcionar. |

### 16.2. Reglas de conciliacion

Las reglas de conciliacion permiten que los movimientos detectados desde correos se asignen automaticamente a la cuenta, categoria y proyecto correctos, sin intervencion manual.

Para crear una regla:

1. Ir a **Configuracion > Reglas de conciliacion**.
2. Hacer clic en **Nueva regla**.
3. Completar:
   - **Nombre**: Identificador de la regla (maximo 100 caracteres).
   - **Patron de comercio**: Texto que debe contener el nombre del comercio en el correo.
   - **Patron de remitente**: Texto que debe contener el remitente del correo.
   - **Patron de asunto**: Texto que debe contener el asunto del correo.
   - **Banco**: Codigo del banco emisor.
   - **Cuenta destino**: Cuenta a la que se asignara el movimiento.
   - **Categoria destino**: Categoria a la que se asignara.
   - **Proyecto destino**: Proyecto al que se asignara.
   - **Aplicacion destino**: Aplicacion a la que se asignara.
   - **Auto-confirmar**: Si se activa, el movimiento se confirma automaticamente sin pasar por la bandeja de revision.
   - **Prioridad**: Numero del 1 al 100. Reglas con menor numero se evaluan primero.
   - **Activa**: Si la regla esta en funcionamiento.
4. Hacer clic en **Guardar**.

> Las reglas se evaluan en orden de prioridad. La primera regla que coincida se aplica. Si ninguna regla coincide, el movimiento queda en la bandeja de revision manual.

---

## 17. Reportes

El modulo de Reportes permite generar resumenes financieros por periodo.

Tipos de reportes disponibles:

| Reporte | Descripcion |
|---|---|
| Personal | Ingresos y egresos personales agrupados por categoria y periodo. |
| Empresarial | Ingresos, costos y pagos de la empresa. |
| Empleo | Desglose de ingresos laborales por contrato y empresa. |

Para cada reporte se puede:

- Seleccionar el **rango de fechas**.
- Filtrar por **cuenta**, **categoria**, **persona** o **proyecto**.
- Ver totales agrupados por mes, categoria o entidad.

---

## 18. Renta

El modulo de Renta permite visualizar los ingresos del ano actual y estimar obligaciones tributarias. Muestra:

- **Ingresos anuales**: Suma de todos los ingresos del ano fiscal.
- **Desglose mensual**: Ingresos mes a mes.
- **Proyeccion de renta**: Estimacion basada en los ingresos acumulados.

> Esta seccion es una herramienta de referencia. Para calculos tributarios oficiales, consultar con un contador.

---

## 19. Modulo MIMOTECH

El modulo MIMOTECH esta disponible solo en espacios de trabajo de tipo empresarial. Agrupa las herramientas de gestion financiera del negocio.

### 19.1. Costos

La pantalla de Costos muestra los egresos clasificados como costos operativos de la empresa (tipo `BUSINESS_COST`).

Permite:

- Ver todos los costos del negocio en una tabla con filtros por proyecto, cuenta, categoria y persona.
- Crear nuevos costos con los mismos campos que un movimiento normal.
- Editar y eliminar costos existentes.

### 19.2. Talentos

La pantalla de Talentos es el centro de gestion del equipo. Muestra cada talento con su perfil, contratos activos y libro mayor.

Cada talento tiene un perfil que incluye:

- **Nombre**, **correo**, **telefono**.
- **Rol**: Funcion que desempena.
- **Estado**: `Activo` o `Inactivo`.
- **Fechas**: Inicio y fin de la relacion laboral, primer trabajo, periodo de estudios.
- **Token de acceso**: Para que el talento acceda a su portal personal (ver [Portal de talentos](#20-portal-de-talentos-mimotalents)).

Desde la ficha de un talento se puede acceder a:

- **Contratos**: Lista de contratos asociados al talento.
- **Libro mayor**: Historial de pagos realizados, deudas pendientes y montos retenidos.
- **Distribucion de ingresos**: Como se reparte el ingreso que genera el talento entre su salario y lo que retiene la empresa.

### 19.3. Equipo

La pantalla de Equipo muestra los pagos realizados a miembros del equipo (tipo `TEAM_PAYMENT`). Incluye sub-secciones:

- **Pagos**: Lista de todos los pagos al equipo con filtros por persona, proyecto y rango de fechas.
- **Reporte**: Resumen agrupado por persona con totales.

### 19.4. Reporte de talentos

Accesible desde **MIMOTECH > Talentos > Reporte**, esta pantalla muestra un resumen financiero de todos los talentos activos:

- Ingreso total generado por cada talento.
- Costo para la empresa (salario pagado al talento).
- Ingreso neto (lo que retiene la empresa).
- Distribucion mes a mes.

> El reporte de talentos permite evaluar la rentabilidad de cada miembro del equipo.

---

## 20. Portal de talentos (Mimotalents)

El portal de talentos es una vista simplificada a la que acceden los talentos con su token personal. Muestra:

- **Perfil personal**: Datos basicos del talento.
- **Ingresos**: Historial de pagos recibidos.
- **Distribucion de ingresos**: Como se distribuyen los ingresos generados entre el talento y la empresa.

> El acceso al portal requiere un token generado por el administrador desde la ficha del talento en **MIMOTECH > Talentos**.

---

## 21. Obligaciones tributarias

El modulo de Obligaciones Tributarias permite registrar impuestos y compromisos fiscales con sus respectivas cuotas.

Cada obligacion tiene:

- **Nombre**: Identificador (ej. "Renta anual 2025", "IGV enero").
- **Ano fiscal**: Ano al que corresponde.
- **Fecha de vencimiento**: Cuando debe pagarse.
- **Importe**: Monto total o de cada cuota.
- **Numero de cuotas**: En cuantos pagos se divide.
- **Cuotas pagadas**: Cuantas ya se han abonado.
- **Estado**: `Pendiente`, `Pagado` o `Vencido`.

Para registrar el pago de una cuota:

1. Ubicar la obligacion en la tabla.
2. Hacer clic en la cuota correspondiente.
3. Marcar como **Pagado** e ingresar la fecha de pago.
4. Opcional: vincular un movimiento existente que respalde el pago.

---

## 22. Referencia de conceptos

### Estados de movimientos

| Estado | Significado |
|---|---|
| `PAID` | El movimiento ya fue pagado o ejecutado. |
| `PENDING` | El movimiento esta programado pero aun no se ejecuta. |

### Estados de deuda

| Estado | Significado |
|---|---|
| `PENDING` | La deuda esta activa y con saldo pendiente. |
| `PAID` | La deuda fue pagada en su totalidad. |
| `OVERDUE` | La deuda supero su fecha de vencimiento sin ser pagada. |

### Estados de meta de ahorro

| Estado | Significado |
|---|---|
| `ACTIVE` | La meta esta en progreso. |
| `COMPLETED` | Se alcanzo el importe objetivo. |
| `CANCELLED` | La meta fue cancelada. |

### Tipos de espacio de trabajo

| Tipo | Descripcion |
|---|---|
| `PERSONAL` | Espacio para finanzas personales. Incluye movimientos, deudas y ahorros. |
| `BUSINESS` | Espacio empresarial. Incluye modulos de talentos, costos, obligaciones tributarias y reportes avanzados. |

### Roles de miembro de espacio

| Rol | Permisos |
|---|---|
| `EDITOR` | Puede crear, editar y eliminar registros en el espacio de trabajo. |

### Tipos de entrada de libro mayor

| Tipo | Significado |
|---|---|
| `EGRESO` | Pago realizado al talento. |
| `INGRESO` | Ingreso generado por el talento. |
| `RETENCION` | Monto retenido por la empresa. |

---

## 23. Atajos de teclado

| Atajo | Accion |
|---|---|
| `Esc` | Cerrar dialogo o modal abierto. |
| `Enter` | Confirmar formulario activo. |

---

*KoraPay — Gestion financiera personal y empresarial.*

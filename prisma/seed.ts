import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mapExcelStatus, redactSensitiveData, SALARY_CONCEPT, TALENT_TAG, WorkspaceRole } from '@korapay/domain';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATA_DIR = join(__dirname, 'data');

const SEED_USD_TO_PEN = process.env.SEED_USD_TO_PEN;
const SEED_EXCHANGE_DATE = process.env.SEED_EXCHANGE_DATE ?? new Date().toISOString().slice(0, 10);
const SEED_USER_AUTH_ID = process.env.DEMO_USER_AUTH_ID;
const SEED_USER_NAME = process.env.DEMO_USER_NAME;
const SEED_USER_EMAIL = process.env.DEMO_USER_EMAIL;

const REQUIRED_SEED_VARS = {
  SEED_USD_TO_PEN,
  DEMO_USER_AUTH_ID: SEED_USER_AUTH_ID,
  DEMO_USER_NAME: SEED_USER_NAME,
  DEMO_USER_EMAIL: SEED_USER_EMAIL,
};

const missingSeedVars = Object.entries(REQUIRED_SEED_VARS)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingSeedVars.length) {
  console.error(`Faltan variables de entorno para el seed: ${missingSeedVars.join(', ')}`);
  console.error(
    'Ejemplo: SEED_USD_TO_PEN=3.75 DEMO_USER_AUTH_ID=... DEMO_USER_NAME=... DEMO_USER_EMAIL=... pnpm run seed',
  );
  process.exit(1);
}

function load<T>(name: string): T[] {
  const path = join(DATA_DIR, `${name}.json`);
  if (!existsSync(path)) {
    throw new Error(`Falta ${name}.json. Corre: python prisma/data/build.py`);
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as T[];
}

function loadObj<T>(name: string): T {
  const path = join(DATA_DIR, `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function money(v: number | null | undefined): string {
  if (v === null || v === undefined) return '0.00';
  return Number(v).toFixed(2);
}

function toBase(amount: number | null | undefined, currency: string): string {
  const amt = Number(amount ?? 0);
  if (currency === 'USD') return (amt * Number(SEED_USD_TO_PEN)).toFixed(2);
  return amt.toFixed(2);
}

function date(v: string | null | undefined): Date {
  return v ? new Date(v) : new Date();
}

type Catalogs = {
  empresas: string[];
  medios_pago: string[];
  monedas: string[];
  tipo_pagos: string[];
  tipos_movimiento: string[];
  categorias_ingreso: string[];
  categorias_gasto: string[];
  categorias_fijos: string[];
  personas_mimotech: string[];
  suscripciones: string[];
};

const PERU_BANKS = [
  'BBVA',
  'BCP',
  'IBK',
  'Scotiabank',
  'Pichincha',
  'Mi Banco',
  'Agora',
  'Caja Arequipa',
  'Caja Huancayo',
  'Banco de la Nacion',
];

const BANK_ALIASES: Record<string, string> = { interbank: 'IBK' };

function canonicalBank(name: string): string {
  return BANK_ALIASES[name.trim().toLowerCase()] ?? name.trim();
}

const PAYMENT_METHODS = [
  'Efectivo',
  'Transferencia',
  'Yape',
  'Plin',
  'Tarjeta de crédito',
  'Tarjeta de débito',
  'PayPal',
  'Planilla',
  'RxH',
];

function dedupeByNormalized(names: string[]): string[] {
  const seen = new Map<string, string>();
  for (const name of names) {
    const key = name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!seen.has(key)) seen.set(key, name.trim());
  }
  return [...seen.values()];
}

const BANK_TOKENS = new Set([...PERU_BANKS, 'Interbank'].map((b) => b.toLowerCase()));

function isBank(name: string): boolean {
  return BANK_TOKENS.has(name.trim().toLowerCase());
}

async function clean() {
  await prisma.auditLog.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.talentIncomeDistribution.deleteMany();
  await prisma.talentContract.deleteMany();
  await prisma.talentProfile.deleteMany();
  await prisma.savingBalance.deleteMany();
  await prisma.savingEntry.deleteMany();
  await prisma.savingGoal.deleteMany();
  await prisma.debtPayment.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.pendingItem.deleteMany();
  await prisma.transactionSplit.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.taxObligation.deleteMany();
  await prisma.employmentContract.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.person.deleteMany();
  await prisma.company.deleteMany();
  await prisma.client.deleteMany();
  await prisma.project.deleteMany();
  await prisma.application.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.globalCompany.deleteMany();
  await prisma.globalClient.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.currency.deleteMany();
  await prisma.importIssue.deleteMany();
  await prisma.importSheet.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.profile.deleteMany();
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed bloqueado en produccion');
    process.exit(1);
  }
  console.log('Sembrando KoraPay con datos reales del Excel...');
  await clean();

  const catalogs = loadObj<Catalogs>('catalogs');

  const profile = await prisma.profile.create({
    data: {
      authId: SEED_USER_AUTH_ID,
      name: SEED_USER_NAME,
      email: SEED_USER_EMAIL,
      currency: 'PEN',
      theme: 'system',
    },
  });

  // ---- Catalogos globales ----
  await prisma.currency.createMany({
    data: [
      { code: 'PEN', symbol: 'S/', name: 'Sol peruano' },
      { code: 'USD', symbol: '$', name: 'Dolar estadounidense' },
    ],
    skipDuplicates: true,
  });
  const usd = await prisma.currency.findUnique({ where: { code: 'USD' } });
  const pen = await prisma.currency.findUnique({ where: { code: 'PEN' } });
  if (usd && pen) {
    await prisma.exchangeRate.create({
      data: { fromCurrencyId: usd.id, toCurrencyId: pen.id, rate: SEED_USD_TO_PEN, date: new Date(SEED_EXCHANGE_DATE) },
    });
  }
  const excelMixed = [...catalogs.tipo_pagos, ...catalogs.medios_pago];
  const paymentMethodNames = dedupeByNormalized([...PAYMENT_METHODS, ...excelMixed.filter((n) => !isBank(n))]);
  await prisma.paymentMethod.createMany({
    data: paymentMethodNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
  const bankNames = dedupeByNormalized([...PERU_BANKS, ...excelMixed.filter(isBank).map(canonicalBank)]);
  await prisma.bank.createMany({
    data: bankNames.map((name) => ({ name, country: 'PE' })),
    skipDuplicates: true,
  });

  // ---- Workspaces ----
  const personal = await prisma.workspace.create({
    data: {
      name: 'Personal',
      type: 'PERSONAL',
      description: 'Finanzas personales de Milagros',
      emoji: '🏠',
      currency: 'PEN',
    },
  });
  const empleos = await prisma.workspace.create({
    data: {
      name: 'Ingresos Laborales',
      type: 'EMPLOYMENT',
      description: 'Empresas donde trabaja Milagros e ingresos por trabajos',
      emoji: '💼',
      currency: 'PEN',
    },
  });
  const mimotech = await prisma.workspace.create({
    data: {
      name: 'MIMOTECH',
      type: 'BUSINESS',
      description: 'Costos, pagos de equipo y talentos tercerizados',
      emoji: '🚀',
      currency: 'PEN',
    },
  });
  const qoryx = await prisma.workspace.create({
    data: {
      name: 'Qoryx',
      type: 'SHARED',
      description: 'Empresa tecnologica 50/50 con socio. Finanzas compartidas.',
      emoji: '🤝',
      currency: 'PEN',
    },
  });
  for (const ws of [personal, empleos, mimotech, qoryx]) {
    await prisma.workspaceMember.create({
      data: { workspaceId: ws.id, profileId: profile.id, role: WorkspaceRole.OWNER },
    });
  }

  // ---- Helpers por workspace ----
  const categoryIcon: Record<string, { emoji: string; color: string }> = {
    default: { emoji: '📁', color: 'bg-slate-100 text-slate-900' },
  };
  const catByWorkspace: Record<string, Record<string, string>> = {};
  async function ensureCategory(workspaceId: string, name: string): Promise<string> {
    const key = name.trim();
    catByWorkspace[workspaceId] ??= {};
    const map = catByWorkspace[workspaceId];
    if (map[key]) return map[key];
    const meta = categoryIcon[key] ?? categoryIcon.default;
    const c = await prisma.category.create({ data: { workspaceId, name: key, emoji: meta.emoji, color: meta.color } });
    map[key] = c.id;
    return c.id;
  }

  const companyByWs: Record<string, Record<string, string>> = {};
  async function ensureCompany(workspaceId: string, name: string | null | undefined): Promise<string | null> {
    if (!name) return null;
    const key = name.trim();
    companyByWs[workspaceId] ??= {};
    const map = companyByWs[workspaceId];
    if (map[key]) return map[key];
    const c = await prisma.company.create({ data: { workspaceId, name: key } });
    map[key] = c.id;
    return c.id;
  }

  const personByWs: Record<string, Record<string, string>> = {};
  async function ensurePerson(
    workspaceId: string,
    name: string | null | undefined,
    kind = 'TEAM',
  ): Promise<string | null> {
    if (!name) return null;
    const key = name.trim();
    personByWs[workspaceId] ??= {};
    const map = personByWs[workspaceId];
    if (map[key]) return map[key];
    const initials = key
      .split(/\s+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const p = await prisma.person.create({ data: { workspaceId, name: key, initials, kind } });
    map[key] = p.id;
    return p.id;
  }

  const appByName: Record<string, string> = {};
  async function ensureApplication(name: string | null | undefined): Promise<string | null> {
    if (!name) return null;
    const key = name.trim();
    if (appByName[key]) return appByName[key];
    const a = await prisma.application.create({
      data: { workspaceId: mimotech.id, name: key },
    });
    appByName[key] = a.id;
    return a.id;
  }

  const projectByName: Record<string, string> = {};
  async function ensureProject(name: string | null | undefined): Promise<string | null> {
    if (!name) return null;
    const key = name.trim();
    if (!key) return null;
    if (projectByName[key]) return projectByName[key];
    const p = await prisma.project.create({ data: { workspaceId: mimotech.id, name: key } });
    projectByName[key] = p.id;
    return p.id;
  }
  async function ensureProjects(raw: string | null | undefined): Promise<string[]> {
    if (!raw) return [];
    const names = raw
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    const ids: string[] = [];
    for (const n of names) {
      const id = await ensureProject(n);
      if (id && !ids.includes(id)) ids.push(id);
    }
    return ids;
  }

  // ============================================================
  // Ingresos Laborales (EMPLOYMENT): empresas + ingresos + contratos + renta
  // ============================================================
  for (const empresa of catalogs.empresas) await ensureCompany(empleos.id, empresa);
  for (const cat of catalogs.categorias_ingreso) await ensureCategory(empleos.id, cat);

  const INCOME_CATEGORY_ALIASES: Record<string, string> = { Empresas: SALARY_CONCEPT };
  const normalizeIncomeCategory = (concepto: string | null | undefined): string =>
    INCOME_CATEGORY_ALIASES[(concepto ?? '').trim()] ?? concepto ?? SALARY_CONCEPT;

  const ingresosTrabajos = load<{
    fecha: string;
    mes: string | null;
    concepto: string | null;
    empresa: string | null;
    pago: string | null;
    moneda: string;
    totalSoles: number | null;
    totalDolar: number | null;
    totalNeto: number | null;
    numeroCuenta: string | null;
    estado: string | null;
  }>('ingresos_trabajos');
  const pagoCountByCompany: Record<string, Record<string, number>> = {};
  let incomeCount = 0;
  for (const r of ingresosTrabajos) {
    const currency = r.moneda === 'USD' ? 'USD' : 'PEN';
    const original = currency === 'USD' ? (r.totalDolar ?? r.totalSoles ?? 0) : (r.totalSoles ?? 0);
    const companyId = await ensureCompany(empleos.id, r.empresa);
    if (r.empresa && r.pago) {
      const key = r.empresa.trim();
      pagoCountByCompany[key] ??= {};
      pagoCountByCompany[key][r.pago] = (pagoCountByCompany[key][r.pago] ?? 0) + 1;
    }
    const categoryId = await ensureCategory(empleos.id, normalizeIncomeCategory(r.concepto));
    await prisma.transaction.create({
      data: {
        workspaceId: empleos.id,
        type: 'INCOME',
        concept: r.concepto ?? 'Ingreso',
        description: r.numeroCuenta ? redactSensitiveData(r.numeroCuenta) : null,
        date: date(r.fecha),
        amountOriginal: money(original),
        currency,
        exchangeRate: currency === 'USD' ? SEED_USD_TO_PEN : null,
        amountBase: toBase(original, currency),
        categoryId,
        companyId,
        status: mapExcelStatus(r.estado),
        tags: [r.pago ?? '', r.mes ?? ''].filter(Boolean),
      },
    });
    incomeCount++;
  }

  function dominantPago(empresa: string): string | null {
    const counts = pagoCountByCompany[empresa.trim()];
    if (!counts) return null;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  const empresas = load<{
    empresaOficial: string | null;
    empresas: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
  }>('ingresos_empresas');
  let contractCount = 0;
  const seenContracts = new Set<string>();
  const companyPeriods: Record<string, { ini: string[]; fin: string[] }> = {};
  const companyClients: Record<string, Set<string>> = {};
  for (const r of empresas) {
    if (!r.empresaOficial) continue;
    const empresa = r.empresaOficial.trim();
    const empresasField = r.empresas?.trim() ?? '';

    companyPeriods[empresa] ??= { ini: [], fin: [] };
    if (r.fechaInicio) companyPeriods[empresa].ini.push(r.fechaInicio);
    if (r.fechaFin) companyPeriods[empresa].fin.push(r.fechaFin);

    const isContractVariant = empresasField !== empresa && empresasField.startsWith(empresa);
    if (!isContractVariant && empresasField && empresasField !== empresa) {
      companyClients[empresa] ??= new Set();
      companyClients[empresa].add(empresasField);
    }
    if (!r.fechaInicio) continue;
    const key = `${empresa}-${r.fechaInicio}`;
    if (seenContracts.has(key)) continue;
    seenContracts.add(key);
    const companyId = await ensureCompany(empleos.id, empresa);
    await prisma.employmentContract.create({
      data: {
        workspaceId: empleos.id,
        companyId,
        position: isContractVariant ? empresasField : null,
        type: dominantPago(empresa),
        startDate: date(r.fechaInicio),
        endDate: r.fechaFin ? date(r.fechaFin) : null,
        status: r.fechaFin ? 'FINISHED' : 'ACTIVE',
      },
    });
    contractCount++;
  }

  let clientCount = 0;
  for (const [empresa, periods] of Object.entries(companyPeriods)) {
    const companyId = await ensureCompany(empleos.id, empresa);
    const ini = periods.ini.sort()[0];
    const fin = periods.fin.sort().at(-1);
    await prisma.company.update({
      where: { id: companyId },
      data: {
        startDate: ini ? date(ini) : null,
        endDate: fin ? date(fin) : null,
      },
    });
    for (const clientName of companyClients[empresa] ?? []) {
      await prisma.client.create({
        data: { workspaceId: empleos.id, companyId, name: clientName },
      });
      clientCount++;
    }
  }

  const renta = load<{ anio: number; monto: number | null; estado: string | null; detalles: string | null }>(
    'renta_anual',
  );
  for (const r of renta) {
    const detalles = r.detalles ?? '';
    const cuotasMatch = detalles.match(/(\d+)\s*cuota/i);
    const finMatch = detalles.match(/FIN:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
    const installments = cuotasMatch ? Number(cuotasMatch[1]) : null;
    const dueDate = finMatch
      ? new Date(Date.UTC(Number(finMatch[3]), Number(finMatch[2]) - 1, Number(finMatch[1])))
      : new Date(`${r.anio + 1}-06-30`);
    const obligation = await prisma.taxObligation.create({
      data: {
        workspaceId: empleos.id,
        name: `Renta Anual ${r.anio}`,
        year: r.anio,
        dueDate,
        amount: money(r.monto),
        status: (r.estado ?? '').toLowerCase() === 'pagado' ? 'PAID' : 'PENDING',
        installments,
        notes: r.detalles ?? null,
      },
    });
    if (installments && installments > 0) {
      const per = Number(money(r.monto)) / installments;
      await prisma.taxObligationInstallment.createMany({
        data: Array.from({ length: installments }, (_, i) => {
          const due = new Date(dueDate);
          due.setUTCMonth(due.getUTCMonth() - (installments - (i + 1)));
          return {
            taxObligationId: obligation.id,
            number: i + 1,
            amount: per.toFixed(2),
            dueDate: due,
            status: 'PENDING',
          };
        }),
      });
    }
  }

  // ============================================================
  // Personal (PERSONAL): egresos + ahorros + cuentas
  // ============================================================
  const egresos = load<{
    fecha: string;
    mes: string | null;
    fijoNoFijo: string | null;
    concepto: string | null;
    descripcion: string | null;
    monto: number | null;
    banco: string | null;
    masDetalle: string | null;
    estado: string | null;
  }>('egresos_personal');
  let expenseCount = 0;
  for (const r of egresos) {
    const categoryId = await ensureCategory(personal.id, r.concepto ?? 'Extras');
    await prisma.transaction.create({
      data: {
        workspaceId: personal.id,
        type: 'EXPENSE',
        concept: r.concepto ?? 'Gasto',
        description: r.descripcion ?? null,
        date: date(r.fecha),
        amountOriginal: money(r.monto),
        currency: 'PEN',
        amountBase: money(r.monto),
        categoryId,
        status: mapExcelStatus(r.estado),
        tags: [r.fijoNoFijo ?? '', r.banco ?? '', r.mes ?? ''].filter(Boolean),
        notes: r.masDetalle ?? null,
      },
    });
    expenseCount++;
  }

  const ahorros = load<{
    fecha: string;
    anio: number | null;
    nMes: number | null;
    descripcion: string | null;
    banco: string | null;
    moneda: string;
    monto: number | null;
    importeTotal: number | null;
  }>('ahorros');
  let savingBalanceCount = 0;
  for (const r of ahorros) {
    if (r.monto == null && r.importeTotal == null) continue;
    const bucket = r.descripcion ?? `Ahorro ${r.banco ?? 'General'}`;
    const currency = r.moneda === 'USD' ? 'USD' : 'PEN';
    const amount = r.monto ?? 0;
    const d = date(r.fecha);
    const amountBase = r.importeTotal != null ? money(r.importeTotal) : toBase(amount, currency);
    await prisma.savingBalance.create({
      data: {
        workspaceId: personal.id,
        bucket,
        bank: r.banco ?? null,
        currency,
        year: r.anio != null ? Math.trunc(r.anio) : d.getUTCFullYear(),
        month: r.nMes != null ? Math.trunc(r.nMes) : d.getUTCMonth() + 1,
        amount: money(amount),
        amountBase,
      },
    });
    savingBalanceCount++;
  }

  function extractPaymentMethod(cardInfo: string | null): string {
    if (!cardInfo) return '';
    const t = cardInfo.toLowerCase();
    if (t.includes('visa')) return 'Visa';
    if (t.includes('mastercard')) return 'Mastercard';
    if (t.includes('credit card') || t.includes('crédito')) return 'T. Crédito';
    if (t.includes('débito') || t.includes('debit')) return 'T. Débito';
    return '';
  }

  // ============================================================
  // MIMOTECH (BUSINESS): costos + pagos equipo + apps + proyectos + talentos
  // ============================================================
  const costos = load<{
    fecha: string;
    aplicacion: string | null;
    proyecto: string | null;
    descripcion: string | null;
    numeroTarjetaCuenta: string | null;
    banco: string | null;
    moneda: string;
    monto: number | null;
    importeTotal: number | null;
    estado: string | null;
  }>('mimotech_costos');
  let costCount = 0;
  for (const r of costos) {
    const currency = r.moneda === 'USD' ? 'USD' : 'PEN';
    const applicationId = await ensureApplication(r.aplicacion);
    const projectIds = await ensureProjects(r.proyecto);
    const medio = extractPaymentMethod(r.numeroTarjetaCuenta);
    await prisma.transaction.create({
      data: {
        workspaceId: mimotech.id,
        type: 'BUSINESS_COST',
        concept: r.aplicacion ?? 'Costo',
        description: r.descripcion ?? null,
        date: date(r.fecha),
        amountOriginal: money(r.monto),
        currency,
        exchangeRate: currency === 'USD' ? SEED_USD_TO_PEN : null,
        amountBase: r.importeTotal != null ? money(r.importeTotal) : toBase(r.monto, currency),
        applicationId,
        projectId: projectIds[0] ?? null,
        projects: projectIds.length ? { connect: projectIds.map((id) => ({ id })) } : undefined,
        status: mapExcelStatus(r.estado),
        notes: r.numeroTarjetaCuenta ? redactSensitiveData(r.numeroTarjetaCuenta) : null,
        tags: [r.banco ?? '', medio].filter(Boolean),
      },
    });
    costCount++;
  }

  const pagos = load<{
    persona: string | null;
    fecha: string;
    mes: string | null;
    estado: string | null;
    notas: string | null;
    monto: number | null;
  }>('mimotech_pagos');
  let teamPayCount = 0;
  const amountsByPerson: Record<string, number[]> = {};
  for (const r of pagos) {
    const personId = await ensurePerson(mimotech.id, r.persona, 'TEAM');
    if (personId && r.monto != null) {
      amountsByPerson[personId] ??= [];
      amountsByPerson[personId].push(r.monto);
    }
    await prisma.transaction.create({
      data: {
        workspaceId: mimotech.id,
        type: 'TEAM_PAYMENT',
        concept: `Pago ${r.persona ?? 'equipo'}`,
        description: r.notas ?? null,
        date: date(r.fecha),
        amountOriginal: money(r.monto),
        currency: 'PEN',
        amountBase: money(r.monto),
        personId,
        status: mapExcelStatus(r.estado),
        tags: [r.mes ?? ''].filter(Boolean),
      },
    });
    teamPayCount++;
  }
  // Salario de referencia por persona = monto de pago más frecuente (tarifa por periodo)
  for (const [personId, amounts] of Object.entries(amountsByPerson)) {
    const freq = new Map<number, number>();
    for (const a of amounts) freq.set(a, (freq.get(a) ?? 0) + 1);
    const mostCommon = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (mostCommon != null) {
      await prisma.person.update({ where: { id: personId }, data: { salary: money(mostCommon) } });
    }
  }

  // ---- MIMOTECH: talentos tercerizados ----
  const talentsGeneral = load<{
    nombre: string;
    inicioConmigo: string | null;
    finConmigo: string | null;
    inicioPrimerTrabajo: string | null;
    diapositiva: string | null;
    lugarEstudio: string | null;
    inicioEstudios: string | null;
    finEstudios: string | null;
    estado: string | null;
  }>('talents_general');
  const cleanStudy = (v: string | null): string | null => {
    const t = (v ?? '').trim();
    return t === '' || t.toUpperCase() === 'NO TIENE' ? null : t;
  };
  const parseNameRole = (raw: string): { name: string; role: string | null } => {
    const m = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (m) return { name: (m[1] ?? '').trim(), role: (m[2] ?? '').trim() };
    return { name: raw.trim(), role: null };
  };
  const talentByName: Record<string, string> = {};
  for (const r of talentsGeneral) {
    const { name, role } = parseNameRole(r.nombre);
    const t = await prisma.talentProfile.create({
      data: {
        workspaceId: mimotech.id,
        name,
        role,
        status: (r.estado ?? '').toLowerCase() === 'activo' ? 'ACTIVE' : 'INACTIVE',
        startedWithMeAt: r.inicioConmigo ? date(r.inicioConmigo) : null,
        endedWithMeAt: r.finConmigo ? date(r.finConmigo) : null,
        firstJobAt: r.inicioPrimerTrabajo ? date(r.inicioPrimerTrabajo) : null,
        studyPlace: cleanStudy(r.lugarEstudio),
        studyStartAt: r.inicioEstudios ? date(r.inicioEstudios) : null,
        studyEndAt: r.finEstudios ? date(r.finEstudios) : null,
        slideUrl: r.diapositiva ?? null,
      },
    });
    const first = name.split(/\s+/)[0]?.toLowerCase() ?? name.toLowerCase();
    if (!talentByName[first]) talentByName[first] = t.id;
  }
  function matchTalent(name: string | null | undefined): string | null {
    if (!name) return null;
    const first = name.split(/\s+/)[0]?.toLowerCase() ?? '';
    return talentByName[first] ?? null;
  }

  const talentIngresos = load<{
    nombre: string;
    fecha: string;
    anio: number | null;
    nMes: number | null;
    empresa: string | null;
    cliente: string | null;
    pagos: string | null;
    cargo: string | null;
    sueldo: number | null;
    conDescuento: number | null;
    recibi: number | null;
    seQuedoCon: number | null;
    estado: string | null;
    inicio: string | null;
    fin: string | null;
  }>('talents_ingresos');

  const SPECIAL_PAYMENT = ['GRATIFICACION', 'LIQUIDACION', 'CTS'];
  const parseEmpresaField = (raw: string | null): { company: string | null; paymentType: string } => {
    const v = (raw ?? '').trim();
    if (!v) return { company: null, paymentType: 'Mensual' };
    const upper = v.toUpperCase();
    for (const kw of SPECIAL_PAYMENT) {
      if (upper.startsWith(kw)) {
        const inner = v.match(/\(([^)]+)\)/)?.[1]?.trim() ?? null;
        const label = kw === 'GRATIFICACION' ? 'Gratificación' : kw === 'LIQUIDACION' ? 'Liquidación' : 'CTS';
        return { company: inner, paymentType: label };
      }
    }
    return { company: v.replace(/\s*\(\d+\)\s*$/, '').trim(), paymentType: 'Mensual' };
  };

  const globalCompanyNames = new Set<string>();
  const globalClientNames = new Set<string>();
  for (const r of talentIngresos) {
    const { company } = parseEmpresaField(r.empresa);
    if (company) globalCompanyNames.add(company);
    if (r.cliente?.trim()) globalClientNames.add(r.cliente.trim());
  }
  for (const empresa of catalogs.empresas) globalCompanyNames.add(empresa.trim());
  await prisma.globalCompany.createMany({
    data: [...globalCompanyNames].map((name) => ({ name })),
    skipDuplicates: true,
  });
  await prisma.globalClient.createMany({
    data: [...globalClientNames].map((name) => ({ name })),
    skipDuplicates: true,
  });

  const contractByKey: Record<string, string> = {};
  let distCount = 0;
  let talentIncomeCount = 0;
  for (const r of talentIngresos) {
    const talentId = matchTalent(r.nombre);
    if (!talentId) continue;
    const { company, paymentType } = parseEmpresaField(r.empresa);
    const contractKey = `${talentId}-${company ?? ''}-${r.cargo ?? ''}`;
    let contractId = contractByKey[contractKey];
    if (!contractId) {
      const c = await prisma.talentContract.create({
        data: {
          talentProfileId: talentId,
          companyName: company,
          clientName: r.cliente ?? null,
          position: r.cargo ?? null,
          paymentType: r.pagos ?? null,
          rate: r.sueldo != null ? money(r.sueldo) : null,
          currency: 'PEN',
          startDate: date(r.inicio ?? r.fecha),
          endDate: r.fin ? date(r.fin) : null,
          status: r.fin ? 'FINISHED' : 'ACTIVE',
          notes: null,
        },
      });
      contractId = c.id;
      contractByKey[contractKey] = contractId;
    }
    const tx = await prisma.transaction.create({
      data: {
        workspaceId: mimotech.id,
        type: 'INCOME',
        concept: `${r.nombre} - ${company ?? r.cargo ?? 'Ingreso'}`,
        date: date(r.fecha),
        amountOriginal: money(r.sueldo),
        currency: 'PEN',
        amountBase: money(r.sueldo),
        status: mapExcelStatus(r.estado),
        tags: [r.cargo ?? '', TALENT_TAG].filter(Boolean),
      },
    });
    talentIncomeCount++;
    const d = date(r.fecha);
    await prisma.talentIncomeDistribution.create({
      data: {
        contractId,
        transactionId: tx.id,
        date: d,
        year: r.anio != null ? Math.trunc(r.anio) : d.getUTCFullYear(),
        month: r.nMes != null ? Math.trunc(r.nMes) : d.getUTCMonth() + 1,
        paymentType,
        salary: r.sueldo != null ? money(r.sueldo) : null,
        amountWithDiscount: money(r.conDescuento ?? r.sueldo),
        amountReceived: money(r.recibi),
        amountRetained: money(r.seQuedoCon),
        status: mapExcelStatus(r.estado),
      },
    });
    distCount++;
  }

  const talentEgresos = load<{
    nombre: string;
    fecha: string;
    anio: number | null;
    nMes: number | null;
    mes: string | null;
    tipoPago: string | null;
    cantidadE: number | null;
    cantidadD: number | null;
    faltaPagar: number | null;
    descripcion: string | null;
    estado: string | null;
  }>('talents_egresos');
  const talentByFullName: Record<string, string> = {};
  for (const [key, id] of Object.entries(talentByName)) talentByFullName[key] = id;
  async function ensureTalentByName(name: string): Promise<string> {
    const matched = matchTalent(name);
    if (matched) return matched;
    const key = name.trim().toLowerCase();
    if (talentByFullName[key]) return talentByFullName[key];
    const t = await prisma.talentProfile.create({
      data: { workspaceId: mimotech.id, name: name.trim(), status: 'ACTIVE' },
    });
    talentByFullName[key] = t.id;
    return t.id;
  }
  let talentLedgerCount = 0;
  for (const r of talentEgresos) {
    const talentId = await ensureTalentByName(r.nombre);
    const d = date(r.fecha);
    const type = (r.tipoPago ?? '').toLowerCase().includes('deuda') ? 'DEUDA' : 'EGRESO';
    await prisma.talentLedgerEntry.create({
      data: {
        talentId,
        workspaceId: mimotech.id,
        date: d,
        year: r.anio != null ? Math.trunc(r.anio) : d.getUTCFullYear(),
        month: r.nMes != null ? Math.trunc(r.nMes) : d.getUTCMonth() + 1,
        type,
        paidAmount: money(r.cantidadE ?? 0),
        debtAmount: money(r.cantidadD ?? 0),
        pendingAmount: money(r.faltaPagar ?? 0),
        currency: 'PEN',
        status: mapExcelStatus(r.estado),
        description: r.descripcion ?? null,
        source: 'ADMIN',
        createdBy: profile.id,
      },
    });
    talentLedgerCount++;
  }

  // ============================================================
  // Qoryx (SHARED): estructura inicial (sin datos financieros aun)
  // ============================================================
  for (const cat of ['Ingresos', 'Costos operativos', 'Infraestructura', 'Marketing', 'Legal']) {
    await ensureCategory(qoryx.id, cat);
  }
  const qoryxCatCount = Object.keys(catByWorkspace[qoryx.id] ?? {}).length;

  console.log('Seed completado con datos reales.');
  console.table({
    profile: profile.email,
    'ws Personal (egresos)': expenseCount,
    'ws Personal (savingBalances)': savingBalanceCount,
    'ws Empleos (ingresos)': incomeCount,
    'ws Empleos (empresas)': Object.keys(companyByWs[empleos.id] ?? {}).length,
    'ws Empleos (clientes)': clientCount,
    'ws Empleos (categorias)': Object.keys(catByWorkspace[empleos.id] ?? {}).length,
    'ws Empleos (contratos)': contractCount,
    'ws Empleos (renta)': renta.length,
    'ws MIMOTECH (costos)': costCount,
    'ws MIMOTECH (pagos equipo)': teamPayCount,
    'ws MIMOTECH (talentos)': talentsGeneral.length,
    'ws MIMOTECH (talent income)': talentIncomeCount,
    'ws MIMOTECH (distribuciones)': distCount,
    'ws MIMOTECH (talent ledger)': talentLedgerCount,
    'ws MIMOTECH (apps)': Object.keys(appByName).length,
    'ws MIMOTECH (proyectos)': Object.keys(projectByName).length,
    'ws Qoryx (categorias)': qoryxCatCount,
    banks: bankNames.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mapExcelStatus, redactSensitiveData } from '@korapay/domain';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATA_DIR = join(__dirname, 'data');
const USD_TO_PEN = '3.42';

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
  if (currency === 'USD') return (amt * Number(USD_TO_PEN)).toFixed(2);
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
      authId: 'demo-user-id',
      name: 'Milagros Marquina',
      email: process.env.DEMO_USER_EMAIL ?? 'demo@korapay.local',
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
  });
  const usd = await prisma.currency.findUnique({ where: { code: 'USD' } });
  const pen = await prisma.currency.findUnique({ where: { code: 'PEN' } });
  if (usd && pen) {
    await prisma.exchangeRate.create({
      data: { fromCurrencyId: usd.id, toCurrencyId: pen.id, rate: USD_TO_PEN, date: new Date('2026-07-20') },
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
    await prisma.workspaceMember.create({ data: { workspaceId: ws.id, profileId: profile.id, role: 'OWNER' } });
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
      data: { workspaceId: mimotech.id, name: key, category: 'Infraestructura' },
    });
    appByName[key] = a.id;
    return a.id;
  }

  const projectByName: Record<string, string> = {};
  async function ensureProject(name: string | null | undefined): Promise<string | null> {
    if (!name) return null;
    const key = name.trim();
    if (projectByName[key]) return projectByName[key];
    const p = await prisma.project.create({ data: { workspaceId: mimotech.id, name: key, emoji: '📦' } });
    projectByName[key] = p.id;
    return p.id;
  }

  // ============================================================
  // Ingresos Laborales (EMPLOYMENT): empresas + ingresos + contratos + renta
  // ============================================================
  for (const empresa of catalogs.empresas) await ensureCompany(empleos.id, empresa);
  for (const cat of catalogs.categorias_ingreso) await ensureCategory(empleos.id, cat);

  const INCOME_CATEGORY_ALIASES: Record<string, string> = { Empresas: 'Sueldo' };
  const normalizeIncomeCategory = (concepto: string | null | undefined): string =>
    INCOME_CATEGORY_ALIASES[(concepto ?? '').trim()] ?? concepto ?? 'Sueldo';

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
  let incomeCount = 0;
  for (const r of ingresosTrabajos) {
    const currency = r.moneda === 'USD' ? 'USD' : 'PEN';
    const original = currency === 'USD' ? (r.totalDolar ?? r.totalSoles ?? 0) : (r.totalSoles ?? 0);
    const companyId = await ensureCompany(empleos.id, r.empresa);
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
        exchangeRate: currency === 'USD' ? USD_TO_PEN : null,
        amountBase: toBase(original, currency),
        categoryId,
        companyId,
        status: mapExcelStatus(r.estado),
        tags: [r.pago ?? '', r.mes ?? ''].filter(Boolean),
      },
    });
    incomeCount++;
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
    companyPeriods[empresa] ??= { ini: [], fin: [] };
    if (r.fechaInicio) companyPeriods[empresa].ini.push(r.fechaInicio);
    if (r.fechaFin) companyPeriods[empresa].fin.push(r.fechaFin);
    if (r.empresas && r.empresas.trim() !== empresa) {
      companyClients[empresa] ??= new Set();
      companyClients[empresa].add(r.empresas.trim());
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
    await prisma.taxObligation.create({
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
    const projectId = await ensureProject(r.proyecto);
    await prisma.transaction.create({
      data: {
        workspaceId: mimotech.id,
        type: 'BUSINESS_COST',
        concept: r.aplicacion ?? 'Costo',
        description: r.descripcion ?? null,
        date: date(r.fecha),
        amountOriginal: money(r.monto),
        currency,
        exchangeRate: currency === 'USD' ? USD_TO_PEN : null,
        amountBase: r.importeTotal != null ? money(r.importeTotal) : toBase(r.monto, currency),
        applicationId,
        projectId,
        status: mapExcelStatus(r.estado),
        notes: r.numeroTarjetaCuenta ? redactSensitiveData(r.numeroTarjetaCuenta) : null,
        tags: [r.banco ?? ''].filter(Boolean),
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
  for (const r of pagos) {
    const personId = await ensurePerson(mimotech.id, r.persona, 'TEAM');
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

  // ---- MIMOTECH: talentos tercerizados ----
  const talentsGeneral = load<{
    nombre: string;
    inicioConmigo: string | null;
    finConmigo: string | null;
    diapositiva: string | null;
    lugarEstudio: string | null;
    estado: string | null;
  }>('talents_general');
  const talentByName: Record<string, string> = {};
  for (const r of talentsGeneral) {
    const notes = [r.lugarEstudio ? `Estudios: ${r.lugarEstudio}` : '', r.diapositiva ? `Canva: ${r.diapositiva}` : '']
      .filter(Boolean)
      .join('\n');
    const t = await prisma.talentProfile.create({
      data: {
        workspaceId: mimotech.id,
        name: r.nombre,
        status: (r.estado ?? '').toLowerCase() === 'activo' ? 'ACTIVE' : 'INACTIVE',
        notes: notes || null,
      },
    });
    talentByName[r.nombre.split(/[\s(]/)[0]?.toLowerCase() ?? r.nombre.toLowerCase()] = t.id;
  }
  function matchTalent(name: string | null | undefined): string | null {
    if (!name) return null;
    const first = name.split(/\s+/)[0]?.toLowerCase() ?? '';
    return talentByName[first] ?? null;
  }

  const talentIngresos = load<{
    nombre: string;
    fecha: string;
    empresa: string | null;
    cliente: string | null;
    cargo: string | null;
    sueldo: number | null;
    conDescuento: number | null;
    recibi: number | null;
    seQuedoCon: number | null;
    estado: string | null;
    inicio: string | null;
    fin: string | null;
  }>('talents_ingresos');
  const contractByKey: Record<string, string> = {};
  let distCount = 0;
  let talentIncomeCount = 0;
  for (const r of talentIngresos) {
    const talentId = matchTalent(r.nombre);
    if (!talentId) continue;
    const contractKey = `${talentId}-${r.empresa ?? ''}-${r.cargo ?? ''}`;
    let contractId = contractByKey[contractKey];
    if (!contractId) {
      const c = await prisma.talentContract.create({
        data: {
          talentProfileId: talentId,
          position: r.cargo ?? null,
          rate: r.sueldo != null ? money(r.sueldo) : null,
          currency: 'PEN',
          startDate: date(r.inicio ?? r.fecha),
          endDate: r.fin ? date(r.fin) : null,
          status: r.fin ? 'FINISHED' : 'ACTIVE',
          notes: [r.empresa, r.cliente].filter(Boolean).join(' / ') || null,
        },
      });
      contractId = c.id;
      contractByKey[contractKey] = contractId;
    }
    const tx = await prisma.transaction.create({
      data: {
        workspaceId: mimotech.id,
        type: 'INCOME',
        concept: `${r.nombre} - ${r.empresa ?? r.cargo ?? 'Ingreso'}`,
        date: date(r.fecha),
        amountOriginal: money(r.sueldo),
        currency: 'PEN',
        amountBase: money(r.sueldo),
        status: mapExcelStatus(r.estado),
        tags: [r.cargo ?? '', 'TALENTO'].filter(Boolean),
      },
    });
    talentIncomeCount++;
    await prisma.talentIncomeDistribution.create({
      data: {
        contractId,
        transactionId: tx.id,
        amountWithDiscount: money(r.conDescuento ?? r.sueldo),
        amountReceived: money(r.recibi),
        amountRetained: money(r.seQuedoCon),
        status: 'CONFIRMED',
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

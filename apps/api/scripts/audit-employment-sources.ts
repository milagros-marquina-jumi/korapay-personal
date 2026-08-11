import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'D:/projects-code/MIMOTECH/Mi-Bolsillito/Recursos/korapay-personal/markdown';

interface WorkRow {
  date: string;
  year: number;
  concept: string;
  company: string;
  payType: string;
  currency: string;
  totalPen: string;
  totalUsd: string;
  net: string;
  bank: string;
  account: string;
  status: string;
}

function rows(file: string) {
  return readFileSync(`${BASE}/${file}`, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| 20'))
    .map((l) => l.split('|').map((c) => c.trim()));
}

function readWork(): WorkRow[] {
  return rows('IngresosM_Trabajos.md').map((r) => ({
    date: r[1] ?? '',
    year: Number(r[2] ?? 0),
    concept: r[7] ?? '',
    company: r[8] ?? '',
    payType: r[9] ?? '',
    currency: r[10] ?? '',
    totalPen: r[11] ?? '',
    totalUsd: r[12] ?? '',
    net: r[13] ?? '',
    bank: r[14] ?? '',
    account: r[15] ?? '',
    status: r[16] ?? '',
  }));
}

const money = (v: string) => Number((v || '0').replace(/[^\d.-]/g, '')) || 0;

function section(title: string) {
  console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
}

function report(label: string, ok: boolean, detail = '') {
  const prefix = ok ? 'OK  ' : 'DIF ';
  const suffix = detail ? ` | ${detail}` : '';
  console.log(`${prefix} ${label}${suffix}`);
  return ok;
}

type Tx = {
  id: string;
  date: Date;
  concept: string;
  amountBase: unknown;
  currency: string;
  status: string;
  exchangeRate: unknown;
  company: { name: string } | null;
};

function checkCounts(work: WorkRow[], transactions: Tx[]) {
  section('1. CONTEO DE REGISTROS');
  return report(
    'filas en Trabajos vs transacciones',
    work.length === transactions.length,
    `${work.length} vs ${transactions.length}`,
  );
}

function checkYearTotals(work: WorkRow[], transactions: Tx[]) {
  section('2. TOTAL NETO POR AÑO (origen vs BD)');
  const src = new Map<number, number>();
  for (const w of work) src.set(w.year, (src.get(w.year) ?? 0) + money(w.net));
  const db = new Map<number, number>();
  for (const t of transactions) {
    const y = t.date.getUTCFullYear();
    db.set(y, (db.get(y) ?? 0) + Number(t.amountBase));
  }
  let ok = true;
  for (const y of [...src.keys()].sort((a, b) => a - b)) {
    const s = src.get(y) ?? 0;
    const d = db.get(y) ?? 0;
    if (!report(`${y}`, Math.abs(s - d) < 0.02, `origen ${s.toFixed(2)} vs BD ${d.toFixed(2)}`)) ok = false;
  }
  return ok;
}

function checkCompanyNames(work: WorkRow[], companies: { name: string }[]) {
  section('3. NOMBRES DE EMPRESA (origen vs BD)');
  const src = new Set(work.map((w) => w.company).filter(Boolean));
  const db = new Set(companies.map((c) => c.name));
  const missing = [...src].filter((n) => !db.has(n));
  const extra = [...db].filter((n) => !src.has(n));
  const ok = report('empresas del origen presentes en BD', missing.length === 0, missing.join(', ') || 'todas');
  if (extra.length) console.log(`INFO empresas en BD sin transaccion en el origen: ${extra.join(', ')}`);
  return ok;
}

function checkAssociations(work: WorkRow[], transactions: Tx[]) {
  section('4. ASOCIACION TRANSACCION -> EMPRESA');
  let bad = 0;
  const used = new Set<string>();
  for (const w of work) {
    const match = transactions.find(
      (t) =>
        !used.has(t.id) &&
        t.date.toISOString().slice(0, 10) === w.date &&
        t.concept === w.concept &&
        Math.abs(Number(t.amountBase) - money(w.net)) < 0.01,
    );
    if (!match) continue;
    used.add(match.id);
    if ((match.company?.name ?? '') !== w.company) {
      bad += 1;
      if (bad <= 5) console.log(`     ${w.date} ${w.concept}: origen="${w.company}" BD="${match.company?.name ?? ''}"`);
    }
  }
  const okAssoc = report('empresa asociada correcta', bad === 0, `${bad} discrepancias de ${used.size} emparejadas`);
  const okAll = report('todas las filas emparejadas', used.size === work.length, `${used.size}/${work.length}`);
  return okAssoc && okAll;
}

function checkCurrency(work: WorkRow[], transactions: Tx[]) {
  section('5. MONEDA Y CONVERSION');
  // Una fila marcada USD sin importe en la columna de dolares es un error de tipeo del origen.
  const usdRows = work.filter((w) => w.currency === 'USD' && money(w.totalUsd) > 0);
  const mislabeled = work.filter((w) => w.currency === 'USD' && money(w.totalUsd) === 0);
  console.log(`filas realmente en USD: ${usdRows.length}`);
  if (mislabeled.length) {
    console.log(`INFO filas marcadas USD sin importe en dolares (se tratan como PEN): ${mislabeled.length}`);
    for (const m of mislabeled) console.log(`     ${m.date} ${m.company} PEN=${m.totalPen} neto=${m.net}`);
  }
  const dbUsd = transactions.filter((t) => t.currency === 'USD');
  const okCount = report(
    'transacciones USD en BD',
    dbUsd.length === usdRows.length,
    `${dbUsd.length} vs ${usdRows.length}`,
  );
  const badFx = transactions.filter((t) => t.currency === 'PEN' && t.exchangeRate !== null);
  const okFx = report('sin tipo de cambio en filas PEN', badFx.length === 0, `${badFx.length} con fx residual`);
  return okCount && okFx;
}

function checkStatuses(work: WorkRow[], transactions: Tx[]) {
  section('6. ESTADOS');
  const src = work.filter((w) => w.status === 'Pagado').length;
  const db = transactions.filter((t) => t.status === 'PAID').length;
  return report('pagados', src === db, `origen ${src} vs BD ${db}`);
}

function checkContracts(contracts: unknown[]) {
  section('7. CONTRATOS (IngresosM_Empresas)');
  const instances = new Set<string>();
  const officials = new Set<string>();
  for (const r of rows('IngresosM_Empresas.md')) {
    if (r[5]) officials.add(r[5]);
    if (r[6]) instances.add(r[6]);
  }
  console.log(`empresas oficiales en el origen: ${officials.size}`);
  console.log(`instancias de contrato en el origen: ${instances.size}`);
  return report(
    'contratos en BD == instancias del origen',
    contracts.length === instances.size,
    `${contracts.length} vs ${instances.size}`,
  );
}

function checkRenta(rentaDb: { year: number | null; amount: unknown; status: string }[]) {
  section('8. RENTA (IngresosM_Reporte)');
  const src = readFileSync(`${BASE}/IngresosM_Reporte.md`, 'utf8')
    .split('\n')
    .filter((l) => /^\|\s+\|\s+20\d\d/.test(l))
    .map((l) => l.split('|').map((c) => c.trim()))
    .map((r) => ({ year: Number(r[2]), amount: money(r[3] ?? ''), status: r[4] ?? '' }));

  let ok = true;
  for (const r of src) {
    const db = rentaDb.find((x) => x.year === r.year);
    const okAmount = db && Math.abs(Number(db.amount) - r.amount) < 0.01;
    const okStatus = db && (r.status === 'Pagado') === (db.status === 'PAID');
    const dbAmount = db ? Number(db.amount).toFixed(2) : 'ausente';
    if (
      !report(
        `renta ${r.year}`,
        !!okAmount && !!okStatus,
        `origen ${r.amount}/${r.status} vs BD ${dbAmount}/${db?.status}`,
      )
    )
      ok = false;
  }
  return ok;
}

async function main() {
  const workspace = await prisma.workspace.findFirst({ where: { type: 'EMPLOYMENT', deletedAt: null } });
  if (!workspace) throw new Error('Sin workspace EMPLOYMENT');

  const work = readWork();
  const [transactions, companies, contracts, rentaDb] = await Promise.all([
    prisma.transaction.findMany({
      where: { workspaceId: workspace.id, deletedAt: null, type: 'INCOME' },
      include: { company: { select: { name: true } } },
    }),
    prisma.company.findMany({ where: { workspaceId: workspace.id, deletedAt: null } }),
    prisma.employmentContract.findMany({ where: { workspaceId: workspace.id, deletedAt: null } }),
    prisma.taxObligation.findMany({ where: { workspaceId: workspace.id, deletedAt: null } }),
  ]);

  const results = [
    checkCounts(work, transactions),
    checkYearTotals(work, transactions),
    checkCompanyNames(work, companies),
    checkAssociations(work, transactions),
    checkCurrency(work, transactions),
    checkStatuses(work, transactions),
    checkContracts(contracts),
    checkRenta(rentaDb),
  ];

  const failures = results.filter((r) => !r).length;
  section('RESULTADO');
  console.log(failures === 0 ? 'Sin discrepancias.' : `${failures} bloques con diferencias.`);

  await prisma.$disconnect();
}

main();

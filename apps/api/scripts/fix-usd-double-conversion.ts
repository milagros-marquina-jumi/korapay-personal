import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE = 'D:/projects-code/MIMOTECH/Mi-Bolsillito/Recursos/korapay-personal/markdown/IngresosM_Trabajos.md';

// La columna "Total Neto" del origen ya viene expresada en soles, incluso en las filas
// facturadas en dolares. La migracion la trato como USD y volvio a aplicar el tipo de
// cambio, dejando esos importes multiplicados por 3.42.
interface SourceRow {
  date: string;
  concept: string;
  company: string;
  currency: string;
  amountPen: number;
  amountUsd: number;
  net: number;
}

const money = (v: string) => Number((v || '0').replace(/[^\d.-]/g, '')) || 0;

function readSource(): SourceRow[] {
  return readFileSync(SOURCE, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| 20'))
    .map((l) => l.split('|').map((c) => c.trim()))
    .map((r) => ({
      date: r[1] ?? '',
      concept: r[7] ?? '',
      company: r[8] ?? '',
      currency: r[10] ?? '',
      amountPen: money(r[11] ?? ''),
      amountUsd: money(r[12] ?? ''),
      net: money(r[13] ?? ''),
    }));
}

async function main() {
  const apply = process.argv.includes('--apply');

  const workspace = await prisma.workspace.findFirst({ where: { type: 'EMPLOYMENT', deletedAt: null } });
  if (!workspace) throw new Error('Sin workspace EMPLOYMENT');

  const transactions = await prisma.transaction.findMany({
    where: { workspaceId: workspace.id, deletedAt: null, type: 'INCOME' },
    include: { company: { select: { name: true } } },
  });

  const source = readSource();
  const updates: {
    id: string;
    label: string;
    from: number;
    to: number;
    currency: string;
    fromCurrency: string;
  }[] = [];
  const unmatched: string[] = [];

  for (const row of source) {
    const match = transactions.find(
      (t) =>
        t.date.toISOString().slice(0, 10) === row.date &&
        t.concept === row.concept &&
        (t.company?.name ?? '') === row.company,
    );
    if (!match) {
      unmatched.push(`${row.date} ${row.concept} ${row.company}`);
      continue;
    }

    // Una fila marcada USD pero con importe en la columna de soles es un error de tipeo
    // del origen: se trata como PEN, igual que el resto de meses de esa empresa.
    const reallyUsd = row.currency === 'USD' && row.amountUsd > 0;
    const currency = reallyUsd ? 'USD' : 'PEN';
    const base = Number(match.amountBase);

    if (Math.abs(base - row.net) < 0.01 && match.currency === currency) continue;

    updates.push({
      id: match.id,
      label: `${row.date} ${row.company} ${row.concept}`,
      from: base,
      to: row.net,
      currency,
      fromCurrency: match.currency,
    });
  }

  console.log(`transacciones: ${transactions.length}`);
  console.log(`filas del origen: ${source.length}`);
  console.log(`sin emparejar: ${unmatched.length}`);
  for (const u of unmatched) console.log(`  ${u}`);
  console.log(`\na corregir: ${updates.length}`);
  for (const u of updates) {
    const cur = u.fromCurrency !== u.currency ? ` [${u.fromCurrency} -> ${u.currency}]` : '';
    console.log(`  ${u.label}: ${u.from.toFixed(2)} -> ${u.to.toFixed(2)}${cur}`);
  }

  const delta = updates.reduce((s, u) => s + (u.from - u.to), 0);
  console.log(`\nimporte inflado a retirar: ${delta.toFixed(2)}`);

  if (!apply) {
    console.log('\nUsa --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  for (const u of updates) {
    await prisma.transaction.update({
      where: { id: u.id },
      data: {
        amountBase: u.to.toFixed(2),
        currency: u.currency,
        ...(u.currency === 'PEN' ? { exchangeRate: null } : {}),
      },
    });
  }

  console.log(`\nactualizadas: ${updates.length} transacciones`);
  await prisma.$disconnect();
}

main();

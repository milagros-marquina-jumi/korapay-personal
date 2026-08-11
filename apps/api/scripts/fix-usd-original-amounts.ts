import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE = 'D:/projects-code/MIMOTECH/Mi-Bolsillito/Recursos/korapay-personal/markdown/IngresosM_Trabajos.md';

const money = (v: string) => Number((v || '0').replace(/[^\d.-]/g, '')) || 0;

interface SourceUsd {
  date: string;
  concept: string;
  company: string;
  usd: number;
  net: number;
}

function readUsdRows(): SourceUsd[] {
  return readFileSync(SOURCE, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| 20'))
    .map((l) => l.split('|').map((c) => c.trim()))
    .filter((r) => r[10] === 'USD' && money(r[12] ?? '') > 0)
    .map((r) => ({
      date: r[1] ?? '',
      concept: r[7] ?? '',
      company: r[8] ?? '',
      usd: money(r[12] ?? ''),
      net: money(r[13] ?? ''),
    }));
}

async function main() {
  const apply = process.argv.includes('--apply');

  const workspace = await prisma.workspace.findFirst({ where: { type: 'EMPLOYMENT', deletedAt: null } });
  if (!workspace) throw new Error('Sin workspace EMPLOYMENT');

  const transactions = await prisma.transaction.findMany({
    where: { workspaceId: workspace.id, deletedAt: null, type: 'INCOME', currency: 'USD' },
    include: { company: { select: { name: true } } },
  });

  const source = readUsdRows();
  const updates: { id: string; label: string; usd: number; net: number; rate: number }[] = [];
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
    updates.push({
      id: match.id,
      label: `${row.date} ${row.company} ${row.concept}`,
      usd: row.usd,
      net: row.net,
      rate: row.usd > 0 ? row.net / row.usd : 0,
    });
  }

  console.log(`transacciones USD en BD: ${transactions.length}`);
  console.log(`filas USD en el origen: ${source.length}`);
  console.log(`sin emparejar: ${unmatched.length}`);
  for (const u of unmatched) console.log(`  ${u}`);

  console.log(`\na corregir: ${updates.length}`);
  for (const u of updates) {
    console.log(
      `  ${u.label}: original=${u.usd.toFixed(2)} USD, base=${u.net.toFixed(2)} PEN, fx=${u.rate.toFixed(4)}`,
    );
  }

  if (!apply) {
    console.log('\nUsa --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  for (const u of updates) {
    await prisma.transaction.update({
      where: { id: u.id },
      data: {
        amountOriginal: u.usd.toFixed(2),
        amountBase: u.net.toFixed(2),
        exchangeRate: u.rate.toFixed(4),
        amountGross: null,
      },
    });
  }

  console.log(`\nactualizadas: ${updates.length} transacciones`);
  await prisma.$disconnect();
}

main();

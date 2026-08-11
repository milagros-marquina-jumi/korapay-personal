import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE = 'D:/projects-code/MIMOTECH/Mi-Bolsillito/Recursos/korapay-personal/markdown/IngresosM_Trabajos.md';

interface Row {
  date: string;
  concept: string;
  company: string;
  currency: string;
  gross: number | null;
  net: number;
}

function parseSource(): Row[] {
  const lines = readFileSync(SOURCE, 'utf8').split('\n');
  const rows: Row[] = [];

  for (const line of lines) {
    if (!line.startsWith('| 20')) continue;
    const cells = line.split('|').map((c) => c.trim());
    // | Fecha | Año | N°Mes | Mes | Trim | Tipo | Concepto | Empresa | Pago | Moneda | Total(S/) | Total($) | Neto | ...
    const [, date, , , , , , concept, company, , currency, grossPen, grossUsd, net] = cells;
    if (!date || !net) continue;

    const gross = currency === 'USD' ? grossUsd : grossPen;
    rows.push({
      date,
      concept: concept ?? '',
      company: company ?? '',
      currency: currency ?? 'PEN',
      gross: gross ? Number(gross) : null,
      net: Number(net),
    });
  }
  return rows;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const rows = parseSource();
  console.log(`filas en el Excel: ${rows.length}`);

  const workspace = await prisma.workspace.findFirst({ where: { type: 'EMPLOYMENT', deletedAt: null } });
  if (!workspace) throw new Error('No existe workspace EMPLOYMENT');

  const transactions = await prisma.transaction.findMany({
    where: { workspaceId: workspace.id, deletedAt: null, type: 'INCOME' },
    include: { company: { select: { name: true } } },
    orderBy: { date: 'asc' },
  });
  console.log(`transacciones en BD: ${transactions.length}`);

  const used = new Set<string>();
  let matched = 0;
  let changed = 0;
  const updates: { id: string; net: number; gross: number | null; before: string }[] = [];

  for (const row of rows) {
    const candidate = transactions.find((t) => {
      if (used.has(t.id)) return false;
      if (t.date.toISOString().slice(0, 10) !== row.date) return false;
      if (t.concept !== row.concept) return false;
      return (t.company?.name ?? '') === row.company;
    });
    if (!candidate) continue;

    used.add(candidate.id);
    matched++;

    const currentNet = Number(candidate.amountOriginal);
    const currentGross = candidate.amountGross === null ? null : Number(candidate.amountGross);
    if (currentNet === row.net && currentGross === row.gross) continue;

    changed++;
    updates.push({ id: candidate.id, net: row.net, gross: row.gross, before: currentNet.toFixed(2) });
  }

  console.log(`emparejadas: ${matched} | a corregir: ${changed}`);
  console.log(`sin emparejar en Excel: ${rows.length - matched}`);
  console.log(`sin emparejar en BD: ${transactions.length - used.size}`);

  if (!apply) {
    console.log('\nmodo simulacion. Ejemplos:');
    for (const u of updates.slice(0, 6)) {
      console.log(`  ${u.before} -> neto ${u.net.toFixed(2)} | bruto ${u.gross ?? 'null'}`);
    }
    console.log('\nEjecuta con --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  const rate = 3.42;
  for (const u of updates) {
    const tx = transactions.find((t) => t.id === u.id);
    if (!tx) continue;
    const isUsd = tx.currency === 'USD';
    const exchangeRate = isUsd ? Number(tx.exchangeRate ?? rate) : null;
    await prisma.transaction.update({
      where: { id: u.id },
      data: {
        amountOriginal: u.net,
        amountGross: u.gross,
        amountBase: isUsd ? u.net * (exchangeRate ?? rate) : u.net,
      },
    });
  }
  console.log(`\nactualizadas: ${updates.length}`);
  await prisma.$disconnect();
}

main();

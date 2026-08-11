import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const ws = await p.workspace.findFirst({ where: { name: 'Personal' } });
  if (!ws) return;

  // Category breakdown
  const byCat = await p.$queryRawUnsafe<Array<{ name: string; total: number }>>(`
    SELECT COALESCE(c.name, 'Sin categoria') as name, SUM(t.amount_base)::float as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.workspace_id = '${ws.id}' AND t.type = 'EXPENSE' AND t.deleted_at IS NULL
    GROUP BY c.name
    ORDER BY total DESC
  `);

  console.log('=== GASTOS POR CATEGORIA ===');
  for (const r of byCat) {
    console.log(`${r.name}: S/ ${r.total.toFixed(2)}`);
  }

  // Fixed vs variable
  const tagged = await p.transaction.findMany({
    where: { workspaceId: ws.id, type: 'EXPENSE', deletedAt: null },
    select: { amountBase: true, tags: true },
  });

  let fixed = 0,
    variable = 0;
  for (const t of tagged) {
    const isFixed = t.tags.includes('Fijo');
    if (isFixed) fixed += Number(t.amountBase);
    else variable += Number(t.amountBase);
  }
  console.log(`\n=== FIJO VS NO FIJO ===`);
  console.log(`Fijo: S/ ${fixed.toFixed(2)}`);
  console.log(`No fijo: S/ ${variable.toFixed(2)}`);

  // Year breakdown
  const byYear = await p.$queryRawUnsafe<Array<{ year: number; total: number }>>(`
    SELECT EXTRACT(YEAR FROM date)::int as year, SUM(amount_base)::float as total
    FROM transactions
    WHERE workspace_id = '${ws.id}' AND type = 'EXPENSE' AND deleted_at IS NULL
    GROUP BY year ORDER BY year
  `);
  console.log('\n=== EGRESOS POR AÑO ===');
  for (const r of byYear) {
    console.log(`${r.year}: S/ ${r.total.toFixed(2)}`);
  }

  // Category by year
  const byCatYear = await p.$queryRawUnsafe<Array<{ year: number; name: string; total: number }>>(`
    SELECT EXTRACT(YEAR FROM t.date)::int as year, COALESCE(c.name, 'Sin categoria') as name, SUM(t.amount_base)::float as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.workspace_id = '${ws.id}' AND t.type = 'EXPENSE' AND t.deleted_at IS NULL
    GROUP BY year, c.name
    ORDER BY year, total DESC
  `);

  console.log('\n=== CATEGORIA POR AÑO ===');
  const years = [...new Set(byCatYear.map((r) => r.year))].sort();
  const cats = [...new Set(byCatYear.map((r) => r.name))];
  for (const y of years) {
    let line = `${y}: `;
    for (const c of cats) {
      const entry = byCatYear.find((r) => r.year === y && r.name === c);
      line += `${c}=${entry ? entry.total.toFixed(2) : '0'} | `;
    }
    console.log(line);
  }

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

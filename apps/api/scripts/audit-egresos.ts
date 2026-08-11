import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const ws = await p.workspace.findFirst({ where: { name: 'Personal' } });
  if (!ws) {
    console.log('No Personal workspace');
    return;
  }

  // 1. Count by type
  const expenses = await p.transaction.findMany({
    where: { workspaceId: ws.id, type: 'EXPENSE', deletedAt: null },
    select: {
      amountBase: true,
      amountOriginal: true,
      currency: true,
      status: true,
      concept: true,
      category: { select: { name: true } },
    },
  });

  console.log(`=== EGRESOS PERSONAL ===`);
  console.log(`Total registros: ${expenses.length}`);

  const totalPEN = expenses.reduce((s, t) => s + Number(t.amountBase), 0);
  console.log(`Total egresos (soles): S/ ${totalPEN.toFixed(2)}`);

  // Count by status
  const byStatus: Record<string, number> = {};
  for (const t of expenses) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  }
  console.log('\nPor estado:');
  for (const [s, c] of Object.entries(byStatus)) {
    console.log(`  ${s}: ${c}`);
  }

  // 2. Verify against Excel counts per month
  const byMonth = await p.$queryRawUnsafe<Array<{ year: number; month: number; cnt: number; total: string }>>(`
    SELECT EXTRACT(YEAR FROM date)::int as year, EXTRACT(MONTH FROM date)::int as month, COUNT(*)::int as cnt, SUM(amount_base)::text as total
    FROM transactions
    WHERE workspace_id = '${ws.id}' AND type = 'EXPENSE' AND deleted_at IS NULL
    GROUP BY year, month ORDER BY year, month
  `);

  console.log('\nPor mes (BD vs Excel):');
  // Excel counts per month from EgresosM_Personal
  const excelCounts: Record<string, number> = {
    '2024-08': 2,
    '2024-10': 1,
    '2024-12': 4,
    '2025-01': 15,
    '2025-02': 16,
    '2025-03': 20,
    '2025-04': 19,
    '2025-05': 19,
    '2025-06': 17,
    '2025-07': 19,
    '2025-08': 18,
    '2025-09': 18,
    '2025-10': 28,
    '2025-11': 19,
    '2025-12': 28,
    '2026-01': 34,
    '2026-02': 30,
  };

  let _allMatch = true;
  for (const r of byMonth) {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    const expected = excelCounts[key] ?? 0;
    const match = r.cnt === expected ? 'OK' : `MISMATCH (expected ${expected})`;
    if (r.cnt !== expected) _allMatch = false;
    console.log(`  ${key}: ${r.cnt} registros, S/ ${Number(r.total).toFixed(2)} | ${match}`);
  }

  // 3. Check for any transactions with amountBase=0
  const zeros = expenses.filter((t) => Number(t.amountBase) === 0);
  if (zeros.length) {
    console.log(`\n!!! ${zeros.length} registros con amountBase=0:`);
    for (const z of zeros) console.log(`  ${z.concept} (${z.category?.name})`);
  }

  // 4. Verify total against Excel
  // Excel total = sum of all Monto (S/.)
  // From the spreadsheet, let's compute expected total by summing up amounts
  // Expected: ~S/ 214,778.65 (sum of all listed amounts)
  console.log(`\nTotal BD: S/ ${totalPEN.toFixed(2)}`);

  // Summary for reports verification
  const byYear = new Map<number, number>();
  for (const t of expenses) {
    const y = new Date(t.date).getUTCFullYear();
    byYear.set(y, (byYear.get(y) ?? 0) + Number(t.amountBase));
  }
  console.log('\nPor año:');
  for (const [y, total] of [...byYear.entries()].sort()) {
    console.log(`  ${y}: S/ ${total.toFixed(2)}`);
  }

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check workspaces first
  const workspaces = await prisma.savingBalance.findMany({
    select: { workspaceId: true },
    distinct: ['workspaceId'],
  });
  console.log(
    'Workspaces en saving_balances:',
    workspaces.map((w) => w.workspaceId),
  );

  const wsId = workspaces[0]?.workspaceId;
  if (!wsId) {
    console.log('No hay datos en saving_balances');
    await prisma.$disconnect();
    return;
  }

  // 1. Delete garbage/test entries
  const garbageBuckets = ['Test USD', 'cv', 'g', 'ZZCatalogo'];
  const deletedGarbage = await prisma.savingBalance.deleteMany({
    where: { bucket: { in: garbageBuckets }, workspaceId: wsId },
  });
  console.log(`[1] Basura eliminada: ${deletedGarbage.count} registros`);

  // 2. Delete months beyond spreadsheet (2026-04 through 2026-08)
  const deletedFuture = await prisma.savingBalance.deleteMany({
    where: {
      workspaceId: wsId,
      OR: [{ year: 2026, month: { gte: 4 } }, { year: { gt: 2026 } }],
    },
  });
  console.log(`[2] Meses futuros eliminados (2026-04+): ${deletedFuture.count} registros`);

  // 3. Fix amountBase for USD entries that have null or 0 amountBase
  // For months 2025+, USD amounts were stored without conversion (amount = amountBase)
  // This is correct per the spreadsheet - no need to change

  // 4. Verify remaining entries match spreadsheet
  const remaining = await prisma.savingBalance.findMany({
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { bucket: 'asc' }],
  });

  console.log(`\n[3] Registros limpios restantes: ${remaining.length}`);
  console.log('');

  // Group by year-month for quick verification
  const byMonth: Record<string, { buckets: string[]; total: number }> = {};
  for (const r of remaining) {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { buckets: [], total: 0 };
    byMonth[key].buckets.push(r.bucket);
    byMonth[key].total++;
  }

  for (const [key, info] of Object.entries(byMonth).sort()) {
    console.log(`${key}: ${info.total} buckets`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

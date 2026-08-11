import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const personalWs = await prisma.workspace.findFirst({ where: { name: 'Personal' } });
  if (!personalWs) {
    console.log('Workspace Personal no encontrado');
    return;
  }

  const count = await prisma.transaction.count({
    where: { workspaceId: personalWs.id, type: 'EXPENSE', deletedAt: null },
  });

  console.log(`Total egresos en Personal: ${count}`);

  // Check for suspicious/test entries
  const byMonth = await prisma.$queryRawUnsafe<Array<{ year: number; month: number; cnt: number }>>(`
    SELECT EXTRACT(YEAR FROM date)::int as year, EXTRACT(MONTH FROM date)::int as month, COUNT(*)::int as cnt
    FROM transactions
    WHERE workspace_id = '${personalWs.id}'
      AND type = 'EXPENSE'
      AND deleted_at IS NULL
    GROUP BY year, month
    ORDER BY year, month
  `);

  console.log('\nPor mes:');
  for (const r of byMonth) {
    console.log(`  ${r.year}-${String(r.month).padStart(2, '0')}: ${r.cnt}`);
  }

  // Check for garbage concepts
  const garbage = await prisma.transaction.findMany({
    where: {
      workspaceId: personalWs.id,
      type: 'EXPENSE',
      deletedAt: null,
      concept: { in: ['test', 'Test', 'prueba', 'TEST', 'xxxx'] },
    },
    select: { id: true, concept: true, date: true },
  });
  if (garbage.length) {
    console.log(`\nBasura encontrada: ${garbage.length}`);
    for (const g of garbage) console.log(`  ${g.concept} (${g.date.toISOString().slice(0, 10)})`);
  } else {
    console.log('\nSin basura detectada.');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const WS = '17cbb78b-b2f5-4d37-a93b-b5f0ba923c9d';

async function main() {
  const total = await prisma.talentIncomeDistribution.count();
  const conTx = await prisma.talentIncomeDistribution.count({ where: { transactionId: { not: null } } });
  const sum = await prisma.talentIncomeDistribution.aggregate({
    _sum: { amountReceived: true, amountRetained: true, salary: true },
  });

  console.log('=== TalentIncomeDistribution ===');
  console.log(`  registros            : ${total}`);
  console.log(`  ligados a transaccion: ${conTx}`);
  console.log(`  suma amountReceived  : S/${Number(sum._sum.amountReceived ?? 0).toFixed(2)}`);
  console.log(`  suma amountRetained  : S/${Number(sum._sum.amountRetained ?? 0).toFixed(2)}`);
  console.log(`  suma salary          : S/${Number(sum._sum.salary ?? 0).toFixed(2)}`);

  const tx = await prisma.transaction.aggregate({
    where: { workspaceId: WS, type: 'INCOME', deletedAt: null },
    _sum: { amountBase: true },
    _count: true,
  });
  console.log('\n=== Transacciones INCOME del workspace MIMOTECH ===');
  console.log(`  cantidad     : ${tx._count}`);
  console.log(`  suma amountBase: S/${Number(tx._sum.amountBase ?? 0).toFixed(2)}`);

  const ids = await prisma.talentIncomeDistribution.findMany({
    where: { transactionId: { not: null } },
    select: { transactionId: true },
  });
  const setIds = new Set(ids.map((x) => x.transactionId as string));
  const ligadas = await prisma.transaction.count({
    where: { workspaceId: WS, type: 'INCOME', deletedAt: null, id: { in: [...setIds] } },
  });
  console.log(`  con distribucion de talento: ${ligadas}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const balances = await prisma.savingBalance.findMany({
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { bucket: 'asc' }],
  });

  console.log(`Total registros en saving_balances: ${balances.length}`);
  console.log('');

  for (const b of balances) {
    console.log(
      `${b.year}-${String(b.month).padStart(2, '0')} | ${b.bucket} | ${b.bank ?? '-'} | ${b.currency} | ${b.amount} | ${b.amountBase}`,
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

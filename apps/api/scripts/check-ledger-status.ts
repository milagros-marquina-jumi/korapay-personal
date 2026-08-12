import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.talentLedgerEntry.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  console.log('=== estados en talent_ledger_entry ===');
  for (const r of rows.sort((a, b) => b._count._all - a._count._all)) {
    const conEspacio = r.status === 'NUNCA PAGO';
    console.log(
      `  ${String(r.status).padEnd(16)} ${String(r._count._all).padStart(4)}${conEspacio ? '   <- CON ESPACIO' : ''}`,
    );
  }

  const conEspacio = rows.filter((r) => r.status === 'NUNCA PAGO').reduce((s, r) => s + r._count._all, 0);
  console.log(`\n  registros con "NUNCA PAGO" (espacio): ${conEspacio}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

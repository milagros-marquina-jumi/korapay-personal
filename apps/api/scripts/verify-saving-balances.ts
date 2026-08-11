import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Key entries to verify from spreadsheet (year-month, bucket, expected amount, expected amountBase)
const _SPREADSHEET_CHECKS: Array<[number, number, string, string, string]> = [
  // 2024-04 (exchange rate 3.42 for USD)
  [2024, 4, 'Ahorros (BCP)', '1615.95', '1615.95'],
  [2024, 4, 'Dolares (IBK)', '1349.95', '4616.83'],
  [2024, 4, 'Efectivo', '3000', '3000'],
  // 2024-06
  [2024, 6, 'Dolares (IBK)', '4200', '14364'],
  [2024, 6, 'Warda (BCP)', '7481.56', '7481.56'],
  // 2024-09
  [2024, 9, 'Cuenta ganadora (BBVA)', '6147.95', '6147.95'],
  [2024, 9, 'Ahorros (BBVA)', '12244.9', '12244.9'],
  // 2024-12
  [2024, 12, 'Ahorros (Pichincha soles)', '162678.94', '162678.94'],
  // 2025-01 (no USD conversion)
  [2025, 1, 'Dolares (IBK)', '1838.09', '1838.09'],
  [2025, 1, 'Ahorro (Agora)', '10619.8', '10619.8'],
  // 2025-03
  [2025, 3, 'Cuenta Sueldo (BBVA soles)', '6921.06', '6921.06'],
  // 2026-01
  [2026, 1, 'Ahorro (Agora)', '39713.36', '39713.36'],
  // 2026-03
  [2026, 3, 'Ahorros (IBK)', '12693.56', '12693.56'],
];

async function main() {
  // Group DB by year-month and bucket
  const all = await prisma.savingBalance.findMany({
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { bucket: 'asc' }],
  });

  const dbMap = new Map<string, Map<string, number>>();
  for (const r of all) {
    const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
    if (!dbMap.has(key)) dbMap.set(key, new Map());
    const bucketMap = dbMap.get(key)!;
    const current = bucketMap.get(r.bucket) ?? 0;
    bucketMap.set(r.bucket, current + Number(r.amount));
  }

  console.log('DB por mes (bucket: suma de amounts):');
  for (const [key, buckets] of [...dbMap.entries()].sort()) {
    const total = [...buckets.values()].reduce((a, b) => a + b, 0);
    console.log(`  ${key}: ${buckets.size} buckets, total PEN = ${total.toFixed(2)}`);
  }

  console.log(`\nTotal registros en BD: ${all.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

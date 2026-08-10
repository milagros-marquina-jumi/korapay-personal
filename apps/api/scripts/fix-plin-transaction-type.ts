import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    UPDATE detected_bank_transactions
    SET transaction_type = 'TRANSFER_SENT'
    WHERE transaction_type = 'REFUND'
      AND bank_code = 'IBK'
      AND raw_data_sanitized->>'subject' LIKE '%Plin%'
  `);

  console.log(`Corregidos: ${result} registros`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

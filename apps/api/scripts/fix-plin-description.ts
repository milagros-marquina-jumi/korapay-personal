import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    UPDATE detected_bank_transactions
    SET description = 'Pago Plin / Yape'
    WHERE bank_code = 'IBK'
      AND transaction_type = 'TRANSFER_SENT'
      AND description = 'Interbank'
  `);

  console.log(`Actualizados: ${result} registros`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

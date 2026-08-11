import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  // Find Plin transactions without recipient (description = "Pago Plin / Yape")
  const plinTxs = await p.detectedBankTransaction.findMany({
    where: {
      description: 'Pago Plin / Yape',
      status: 'PENDING_REVIEW',
    },
    select: { id: true, processedEmailId: true, description: true },
  });

  console.log(`Encontradas ${plinTxs.length} transacciones Plin sin destinatario`);

  if (plinTxs.length === 0) {
    console.log('Nada que corregir.');
    await p.$disconnect();
    return;
  }

  // Delete processedEmail records so they can be re-processed
  const emailIds = plinTxs.map((t) => t.processedEmailId);
  await p.processedEmail.deleteMany({ where: { id: { in: emailIds } } });
  console.log(`Eliminados ${emailIds.length} processedEmail`);

  // Delete detected transactions (they'll be recreated on re-sync)
  const txIds = plinTxs.map((t) => t.id);
  await p.detectedBankTransaction.deleteMany({ where: { id: { in: txIds } } });
  console.log(`Eliminadas ${txIds.length} transacciones detectadas`);

  console.log(
    '\nAhora en Gmail: quita la etiqueta KoraPay/Procesado de los hilos Plin y ejecuta syncKoraPayBankEmails.',
  );
  console.log('Los correos se re-procesaran con el parser nuevo (con destinatario).');
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

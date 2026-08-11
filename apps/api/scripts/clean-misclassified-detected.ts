import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profileId = process.argv[2];
  if (!profileId) {
    console.log('Uso: npx ts-node scripts/clean-misclassified-detected.ts <profileId>');
    console.log('El profileId lo encuentras en la URL de tu perfil o en la BD.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Buscando transacciones mal clasificadas para profile ${profileId}...\n`);

  // 1. Find misclassified: BBVA purchases as CASH_WITHDRAWAL (Retiro)
  const badBbva = await prisma.detectedBankTransaction.findMany({
    where: {
      profileId,
      bankCode: 'BBVA',
      transactionType: 'CASH_WITHDRAWAL',
      status: 'PENDING_REVIEW',
    },
    select: { id: true, processedEmailId: true, merchantOriginal: true, amount: true, currency: true },
  });

  // 2. Find misclassified: Interbank transfers as REFUND (Devolucion)
  const badInterbank = await prisma.detectedBankTransaction.findMany({
    where: {
      profileId,
      bankCode: 'IBK',
      transactionType: 'REFUND',
      status: 'PENDING_REVIEW',
    },
    select: { id: true, processedEmailId: true, merchantOriginal: true, amount: true, currency: true },
  });

  // 3. Find BBVA fees as CARD_PURCHASE (Compra)
  const badBbvaFees = await prisma.detectedBankTransaction.findMany({
    where: {
      profileId,
      bankCode: 'BBVA',
      transactionType: 'CARD_PURCHASE',
      status: 'PENDING_REVIEW',
      merchantOriginal: { equals: null },
    },
    select: { id: true, processedEmailId: true, merchantOriginal: true, amount: true, currency: true },
  });

  const allBad = [...badBbva, ...badInterbank, ...badBbvaFees];

  if (allBad.length === 0) {
    console.log('No se encontraron transacciones mal clasificadas.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Encontradas ${allBad.length} transacciones mal clasificadas:`);
  console.log(`  BBVA Retiro (deberia ser Compra): ${badBbva.length}`);
  console.log(`  Interbank Devolucion (deberia ser Transferencia): ${badInterbank.length}`);
  console.log(`  BBVA Sin comercio (deberia ser Servicio/Comision): ${badBbvaFees.length}`);
  console.log('');

  // Show preview
  console.log('Vista previa (primeras 10):');
  for (const tx of allBad.slice(0, 10)) {
    console.log(
      `  - ${tx.merchantOriginal ?? '(sin comercio)'} | ${tx.currency} ${tx.amount} | ID: ${tx.id.slice(0, 8)}...`,
    );
  }
  if (allBad.length > 10) console.log(`  ... y ${allBad.length - 10} mas`);

  console.log('');
  console.log('Para eliminar estas transacciones y permitir re-sync, ejecuta:');
  console.log(`  npx ts-node scripts/clean-misclassified-detected.ts ${profileId} --execute`);
  console.log('');
  console.log('ANTES de eliminar, asegurate de quitar el label KoraPay/Procesado de esos correos en Gmail.');
  console.log('Puedes buscar en Gmail: label:KoraPay/Procesado label:KoraPay/Bancos/BBVA');
  console.log('Seleccionas todos, boton derecho -> Quitar etiqueta "KoraPay/Procesado".');

  const shouldExecute = process.argv.includes('--execute');
  if (!shouldExecute) {
    await prisma.$disconnect();
    return;
  }

  // Collect processedEmailIds to delete
  const processedEmailIds = Array.from(new Set(allBad.map((tx) => tx.processedEmailId).filter(Boolean))) as string[];

  // Delete detected transactions
  const txIds = allBad.map((tx) => tx.id);
  const deletedTx = await prisma.detectedBankTransaction.deleteMany({
    where: { id: { in: txIds } },
  });
  console.log(`\n[OK] ${deletedTx.count} detected_transactions eliminadas.`);

  // Delete processed emails so they can be re-synced
  if (processedEmailIds.length > 0) {
    const deletedEmails = await prisma.processedEmail.deleteMany({
      where: { id: { in: processedEmailIds } },
    });
    console.log(`[OK] ${deletedEmails.count} processed_emails eliminadas.`);
  }

  console.log('\nListo. Ahora quita el label KoraPay/Procesado de Gmail y ejecuta syncKoraPayBankEmails.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

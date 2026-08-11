import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATA_DIR = join(__dirname, '..', '..', '..', 'prisma', 'data');

interface EgresoRow {
  fecha: string;
  concepto: string | null;
  descripcion: string | null;
  monto: number | null;
  masDetalle: string | null;
}

async function main() {
  const raw = readFileSync(join(DATA_DIR, 'egresos_personal.json'), 'utf-8');
  const egresos: EgresoRow[] = JSON.parse(raw);

  console.log(`Cargados ${egresos.length} egresos del Excel.`);

  // Find Personal workspace
  const personal = await prisma.workspace.findFirst({ where: { type: 'PERSONAL' } });
  if (!personal) {
    console.log('No se encontro workspace Personal.');
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const row of egresos) {
    if (!row.masDetalle) {
      skipped++;
      continue;
    }

    const date = new Date(row.fecha);
    const amount = Number(row.monto ?? 0).toFixed(2);

    const tx = await prisma.transaction.findFirst({
      where: {
        workspaceId: personal.id,
        type: 'EXPENSE',
        date,
        amountOriginal: amount,
        description: row.concepto ?? undefined,
        concept: row.descripcion ?? undefined,
      },
    });

    if (!tx) {
      notFound++;
      continue;
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { notes: row.masDetalle },
    });

    updated++;
    if (updated % 50 === 0) console.log(`  ${updated} actualizados...`);
  }

  console.log(`\nResultado:`);
  console.log(`  Actualizados: ${updated}`);
  console.log(`  Sin masDetalle: ${skipped}`);
  console.log(`  No encontrados en BD: ${notFound}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

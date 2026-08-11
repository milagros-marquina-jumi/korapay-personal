import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const ws = await p.workspace.findFirst({ where: { name: 'Personal' } });
  if (!ws) {
    console.log('No Personal workspace');
    return;
  }

  // Only fix Excel-imported transactions (have Fijo/No Fijo tags)
  const txs = await p.transaction.findMany({
    where: {
      workspaceId: ws.id,
      type: 'EXPENSE',
      deletedAt: null,
      tags: { hasSome: ['Fijo', 'No Fijo'] },
    },
    select: { id: true, concept: true, description: true },
  });

  console.log(`Encontrados ${txs.length} egresos`);

  let updated = 0;
  for (const tx of txs) {
    const newConcept = tx.description ?? tx.concept;
    const newDescription = tx.concept;

    await p.transaction.update({
      where: { id: tx.id },
      data: {
        concept: newConcept,
        description: newDescription,
      },
    });
    updated++;
  }

  console.log(`Actualizados: ${updated} registros (concept ↔ description intercambiados)`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

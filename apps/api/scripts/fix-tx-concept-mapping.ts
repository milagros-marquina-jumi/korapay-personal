import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const ws = await p.workspace.findFirst({ where: { name: 'Personal' } });
  if (!ws) {
    console.log('No Personal workspace');
    return;
  }

  const categories = await p.category.findMany({
    where: { workspaceId: ws.id },
    select: { name: true },
  });
  const categoryNames = new Set(categories.map((c) => c.name.toLowerCase()));

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

  let swapped = 0;
  let skipped = 0;

  for (const tx of txs) {
    const conceptIsCategory = categoryNames.has((tx.concept ?? '').toLowerCase());
    const descriptionIsCategory = categoryNames.has((tx.description ?? '').toLowerCase());

    if (conceptIsCategory && !descriptionIsCategory && tx.description) {
      await p.transaction.update({
        where: { id: tx.id },
        data: {
          concept: tx.description,
          description: tx.concept,
        },
      });
      swapped++;
    } else {
      skipped++;
    }
  }

  console.log(`Swapeados: ${swapped} (concept era categoria, ahora tiene el item)`);
  console.log(`Sin cambios: ${skipped} (ya correctos)`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

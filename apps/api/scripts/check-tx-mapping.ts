import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const ws = await p.workspace.findFirst({ where: { name: 'Personal' } });
  if (!ws) {
    console.log('No Personal workspace');
    return;
  }

  const samples = await p.transaction.findMany({
    where: { workspaceId: ws.id, type: 'EXPENSE', deletedAt: null },
    select: { concept: true, description: true, category: { select: { name: true } }, notes: true, tags: true },
    take: 10,
  });

  for (const t of samples) {
    console.log(
      `concept: "${t.concept}" | description: "${t.description}" | category: "${t.category?.name}" | notes: "${t.notes}" | tags: [${t.tags.join(', ')}]`,
    );
  }
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

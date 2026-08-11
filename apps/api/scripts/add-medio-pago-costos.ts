import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
async function main() {
  const ws = await p.workspace.findFirst({ where: { type: 'BUSINESS' } });
  if (!ws) {
    console.log('No MIMOTECH');
    await p.$disconnect();
    return;
  }
  const txs = await p.transaction.findMany({
    where: { workspaceId: ws.id, type: 'BUSINESS_COST', deletedAt: null },
    select: { id: true, notes: true, tags: true },
  });
  let u = 0;
  for (const tx of txs) {
    const medio = extractMedio(tx.notes);
    if (!medio) continue;
    const current = tx.tags.filter((t) => t && t !== 'Visa' && t !== 'T. Credito');
    const newTags = [...current, medio];
    await p.transaction.update({ where: { id: tx.id }, data: { tags: newTags } });
    u++;
  }
  console.log('Actualizados:', u);
  await p.$disconnect();
}
function extractMedio(notes: string | null): string {
  if (!notes) return '';
  const t = notes.toLowerCase();
  if (t.includes('visa')) return 'Visa';
  if (t.includes('credit card')) return 'T. Credito';
  return '';
}
main().catch((e) => {
  console.error(e);
  p.$disconnect().then(() => process.exit(1));
});

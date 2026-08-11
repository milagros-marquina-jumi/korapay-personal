import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
async function main() {
  const ws = await p.workspace.findFirst({ where: { type: 'BUSINESS' } });
  if (!ws) {
    console.log('No MIMOTECH');
    await p.$disconnect();
    return;
  }
  const cats = await p.category.findMany({ where: { workspaceId: ws.id }, select: { name: true } });
  console.log(
    'Categorias:',
    cats.map((c) => c.name),
  );
  const del = await p.category.deleteMany({ where: { workspaceId: ws.id } });
  console.log('Eliminadas:', del.count);
  await p.$disconnect();
}
main().catch((e) => {
  console.error(e);
  p.$disconnect().then(() => process.exit(1));
});

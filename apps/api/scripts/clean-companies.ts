import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
async function main() {
  const ws = await p.workspace.findFirst({ where: { type: 'EMPLOYMENT' } });
  if (!ws) {
    console.log('Sin Empleos');
    await p.$disconnect();
    return;
  }

  const del = await p.company.deleteMany({
    where: { workspaceId: ws.id, name: { in: ['LLATAN 1', 'LLATAN 2', 'SOLMIT 1', 'SOLMIT 2'] } },
  });
  console.log('Companies eliminadas:', del.count);

  const tadcon = await p.company.findFirst({ where: { workspaceId: ws.id, name: 'TADCON' } });
  if (tadcon) {
    const c = await p.client.findMany({ where: { companyId: tadcon.id } });
    console.log(
      'Clientes TADCON:',
      c.map((x) => x.name),
    );
    const d = await p.client.deleteMany({ where: { companyId: tadcon.id } });
    console.log('Clientes TADCON eliminados:', d.count);
  }

  await p.$disconnect();
}
main().catch((e) => {
  console.error(e);
  p.$disconnect().then(() => process.exit(1));
});

import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();
async function main() {
  const ws = await p.workspace.findFirst({ where: { type: 'EMPLOYMENT' } });
  if (!ws) {
    console.log('Sin Empleos');
    await p.$disconnect();
    return;
  }

  const llatan = await p.company.findFirst({ where: { workspaceId: ws.id, name: 'LLATAN' } });
  if (llatan) {
    const cs = await p.employmentContract.findMany({
      where: { companyId: llatan.id, deletedAt: null },
      orderBy: { startDate: 'asc' },
    });
    if (cs[0]) await p.employmentContract.update({ where: { id: cs[0].id }, data: { position: 'LLATAN 1' } });
    if (cs[1]) await p.employmentContract.update({ where: { id: cs[1].id }, data: { position: 'LLATAN 2' } });
    const del = await p.client.deleteMany({ where: { companyId: llatan.id, name: { in: ['LLATAN 1', 'LLATAN 2'] } } });
    console.log('LLATAN:', cs.length, 'contratos,', del.count, 'clientes borrados');
  }

  const solmit = await p.company.findFirst({ where: { workspaceId: ws.id, name: 'SOLMIT' } });
  if (solmit) {
    const cs = await p.employmentContract.findMany({
      where: { companyId: solmit.id, deletedAt: null },
      orderBy: { startDate: 'asc' },
    });
    if (cs[0]) await p.employmentContract.update({ where: { id: cs[0].id }, data: { position: 'SOLMIT 1' } });
    if (cs[1]) await p.employmentContract.update({ where: { id: cs[1].id }, data: { position: 'SOLMIT 2' } });
    const del = await p.client.deleteMany({ where: { companyId: solmit.id, name: { in: ['SOLMIT 1', 'SOLMIT 2'] } } });
    console.log('SOLMIT:', cs.length, 'contratos,', del.count, 'clientes borrados');
  }

  await p.$disconnect();
}
main().catch((e) => {
  console.error(e);
  p.$disconnect().then(() => process.exit(1));
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.workspace.updateMany({ where: { name: 'MIMOTECH' }, data: { emoji: 'Rocket' } });
  await prisma.workspace.updateMany({ where: { name: 'Qoryx' }, data: { emoji: 'Users' } });
  await prisma.workspace.updateMany({ where: { name: 'Ingresos Laborales' }, data: { emoji: 'Briefcase' } });
  console.log('OK');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

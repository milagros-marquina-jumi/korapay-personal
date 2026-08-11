import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Correcciones de nombre confirmadas con el usuario. "merge" indica que ambos registros
// son la misma empresa y hay que fusionarlos conservando el nombre destino.
const RULES: { from: string; to: string; reason: string }[] = [
  { from: 'CSTI', to: 'CSTI Corp', reason: 'misma empresa, la hoja de empleo usa "CSTI Corp"' },
  { from: 'GFT BBVA', to: 'GFT', reason: 'BBVA es el cliente, no parte del nombre' },
  { from: 'iPay.lat', to: 'iPay', reason: 'el dominio no es parte del nombre de la empresa' },
];

async function main() {
  const apply = process.argv.includes('--apply');
  const planned: string[] = [];

  for (const rule of RULES) {
    const source = await prisma.globalCompany.findFirst({ where: { name: rule.from, deletedAt: null } });
    if (!source) {
      planned.push(`SKIP  "${rule.from}" no existe`);
      continue;
    }

    const target = await prisma.globalCompany.findFirst({ where: { name: rule.to, deletedAt: null } });
    const [clients, companies] = await Promise.all([
      prisma.globalClient.count({ where: { globalCompanyId: source.id, deletedAt: null } }),
      prisma.company.count({ where: { globalCompanyId: source.id, deletedAt: null } }),
    ]);

    if (target) {
      planned.push(
        `MERGE "${rule.from}" -> "${rule.to}" (mueve ${clients} clientes, ${companies} empresas) | ${rule.reason}`,
      );
      if (apply) {
        await prisma.globalClient.updateMany({
          where: { globalCompanyId: source.id },
          data: { globalCompanyId: target.id },
        });
        await prisma.company.updateMany({
          where: { globalCompanyId: source.id },
          data: { globalCompanyId: target.id },
        });
        await prisma.globalCompany.update({ where: { id: source.id }, data: { deletedAt: new Date() } });
      }
    } else {
      planned.push(`RENAME "${rule.from}" -> "${rule.to}" | ${rule.reason}`);
      if (apply) await prisma.globalCompany.update({ where: { id: source.id }, data: { name: rule.to } });
    }

    // El cliente homonimo se renombra igual: "iPay.lat" como cliente tambien pierde el dominio.
    const twin = await prisma.globalClient.findFirst({ where: { name: rule.from, deletedAt: null } });
    if (twin) {
      const clash = await prisma.globalClient.findFirst({
        where: { name: rule.to, deletedAt: null, id: { not: twin.id } },
      });
      if (clash) {
        planned.push(`SKIP  cliente "${rule.from}" -> "${rule.to}" ya existe otro cliente con ese nombre`);
      } else {
        planned.push(`RENAME cliente "${rule.from}" -> "${rule.to}"`);
        if (apply) await prisma.globalClient.update({ where: { id: twin.id }, data: { name: rule.to } });
      }
    }
  }

  for (const line of planned) console.log(line);

  if (!apply) {
    console.log('\nUsa --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  const total = await prisma.globalCompany.count({ where: { deletedAt: null } });
  console.log(`\nempresas globales tras normalizar: ${total}`);
  await prisma.$disconnect();
}

main();

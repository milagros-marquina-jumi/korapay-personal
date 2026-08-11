import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes('--apply');

  const [companies, globals] = await Promise.all([
    prisma.company.findMany({ where: { deletedAt: null } }),
    prisma.globalCompany.findMany({ where: { deletedAt: null } }),
  ]);

  const byName = new Map(globals.map((g) => [g.name.trim().toUpperCase(), g]));
  const links: { id: string; name: string; globalId: string }[] = [];
  const missing: string[] = [];

  for (const c of companies) {
    if (c.globalCompanyId) continue;
    const match = byName.get(c.name.trim().toUpperCase());
    if (!match) {
      missing.push(c.name);
      continue;
    }
    links.push({ id: c.id, name: c.name, globalId: match.id });
  }

  console.log(`empresas del workspace: ${companies.length}`);
  console.log(`a enlazar: ${links.length}`);
  console.log(`sin equivalente global: ${missing.length}${missing.length ? ` -> ${missing.join(', ')}` : ''}`);

  if (!apply) {
    for (const l of links.slice(0, 5)) console.log(`  ${l.name} -> ${l.globalId.slice(0, 8)}`);
    console.log('\nUsa --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  // Las empresas sin equivalente se crean en el catalogo global para no perderlas.
  for (const name of missing) {
    const created = await prisma.globalCompany.create({ data: { name } });
    const orphan = companies.find((c) => c.name === name);
    if (orphan) links.push({ id: orphan.id, name, globalId: created.id });
  }

  for (const l of links) {
    await prisma.company.update({ where: { id: l.id }, data: { globalCompanyId: l.globalId } });
  }

  console.log(`\nenlazadas: ${links.length}`);
  await prisma.$disconnect();
}

main();

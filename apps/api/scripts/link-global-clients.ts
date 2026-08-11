import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE = 'D:/projects-code/MIMOTECH/Mi-Bolsillito/Recursos/korapay-personal/markdown/Mimotalents_Ingresos.md';

function normalize(name: string) {
  return name
    .replace(/\s*\(\d+\)\s*$/, '')
    .trim()
    .toUpperCase();
}

function readClientCompanyPairs() {
  const rows = readFileSync(SOURCE, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| ') && !l.includes('---'))
    .slice(1)
    .map((l) => l.split('|').map((c) => c.trim()));

  const byClient = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const company = row[7];
    const client = row[8];
    if (!company || !client) continue;
    const key = normalize(company);
    const counts = byClient.get(client) ?? new Map<string, number>();
    counts.set(key, (counts.get(key) ?? 0) + 1);
    byClient.set(client, counts);
  }

  // Un cliente puede aparecer con varias empresas; nos quedamos con la de mayor frecuencia.
  return new Map(
    [...byClient.entries()].map(([client, counts]) => {
      const winner = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      return [client.toUpperCase(), winner?.[0] ?? ''] as const;
    }),
  );
}

async function main() {
  const apply = process.argv.includes('--apply');
  const pairs = readClientCompanyPairs();

  const [clients, companies] = await Promise.all([
    prisma.globalClient.findMany({ where: { deletedAt: null } }),
    prisma.globalCompany.findMany({ where: { deletedAt: null } }),
  ]);
  const companyByName = new Map(companies.map((c) => [normalize(c.name), c]));

  const updates: { id: string; client: string; company: string; companyId: string }[] = [];
  const unresolved: string[] = [];

  for (const client of clients) {
    if (client.globalCompanyId) continue;
    const companyName = pairs.get(client.name.toUpperCase());
    if (!companyName) {
      unresolved.push(`${client.name} (sin par en el origen)`);
      continue;
    }
    const company = companyByName.get(companyName);
    if (!company) {
      unresolved.push(`${client.name} -> ${companyName} (empresa no existe en el catalogo)`);
      continue;
    }
    updates.push({ id: client.id, client: client.name, company: company.name, companyId: company.id });
  }

  console.log(`clientes globales: ${clients.length}`);
  console.log(`a vincular: ${updates.length}`);
  for (const u of updates) console.log(`  ${u.client} -> ${u.company}`);
  if (unresolved.length) {
    console.log(`\nsin resolver: ${unresolved.length}`);
    for (const u of unresolved) console.log(` ${u}`);
  }

  if (!apply) {
    console.log('\nUsa --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  for (const u of updates) {
    await prisma.globalClient.update({ where: { id: u.id }, data: { globalCompanyId: u.companyId } });
  }
  console.log(`\nvinculados: ${updates.length}`);
  await prisma.$disconnect();
}

main();

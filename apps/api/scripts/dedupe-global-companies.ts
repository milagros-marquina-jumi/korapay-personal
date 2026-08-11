import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMPLOYMENT_SOURCE =
  'D:/projects-code/MIMOTECH/Mi-Bolsillito/Recursos/korapay-personal/markdown/IngresosM_Empresas.md';

// "SOLMIT 1" / "SOLMIT 2" son contratos distintos de la misma empresa en el origen,
// y "Altimea" / "ALTIMEA" es la misma empresa escrita por dos hojas distintas.
function canonicalKey(name: string) {
  return name
    .replace(/ ?\(\d+\)$/, '')
    .replace(/ \d+$/, '')
    .trim()
    .toUpperCase();
}

// La columna "Empresa Oficial" de la hoja de empleo es la fuente del nombre visible.
function readOfficialNames() {
  const names = new Map<string, string>();
  const rows = readFileSync(EMPLOYMENT_SOURCE, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| 20'))
    .map((l) => l.split('|').map((c) => c.trim()));
  for (const row of rows) {
    const official = row[5];
    if (official) names.set(canonicalKey(official), official);
  }
  return names;
}

function score(company: { name: string; companyCount: number; clientCount: number }) {
  // Gana la que ya tiene datos colgando; a igualdad, la que no lleva sufijo numerico.
  const hasSuffix = / \d+$/.test(company.name) ? 0 : 1;
  return company.companyCount * 100 + company.clientCount * 10 + hasSuffix;
}

type GlobalRow = Awaited<ReturnType<typeof loadGlobals>>[number];

function loadGlobals() {
  return prisma.globalCompany.findMany({
    where: { deletedAt: null },
    include: {
      clients: { where: { deletedAt: null }, select: { id: true, name: true } },
      companies: { where: { deletedAt: null }, select: { id: true, name: true } },
    },
  });
}

interface Merge {
  keep: GlobalRow;
  finalName: string;
  drop: GlobalRow[];
}

function buildPlan(globals: GlobalRow[], officialNames: Map<string, string>) {
  const groups = new Map<string, GlobalRow[]>();
  for (const g of globals) {
    const key = canonicalKey(g.name);
    const bucket = groups.get(key) ?? [];
    bucket.push(g);
    groups.set(key, bucket);
  }

  const merges: Merge[] = [];
  const renames: { id: string; from: string; to: string }[] = [];

  for (const [key, bucket] of groups.entries()) {
    const ranked = [...bucket].sort((a, b) => {
      const sa = score({ name: a.name, companyCount: a.companies.length, clientCount: a.clients.length });
      const sb = score({ name: b.name, companyCount: b.companies.length, clientCount: b.clients.length });
      if (sb !== sa) return sb - sa;
      return a.name.localeCompare(b.name);
    });
    const [keep, ...drop] = ranked;
    if (!keep) continue;

    const finalName = officialNames.get(key) ?? keep.name;
    if (drop.length > 0) merges.push({ keep, finalName, drop });
    else if (finalName !== keep.name) renames.push({ id: keep.id, from: keep.name, to: finalName });
  }

  return { merges, renames };
}

async function main() {
  const apply = process.argv.includes('--apply');

  const globals = await loadGlobals();
  const { merges, renames } = buildPlan(globals, readOfficialNames());

  console.log(`empresas globales: ${globals.length}`);
  console.log(`grupos a fusionar: ${merges.length}`);
  for (const m of merges) {
    const moved = m.drop.flatMap((d) => [...d.companies.map((c) => c.name), ...d.clients.map((c) => c.name)]);
    const renamed = m.finalName !== m.keep.name ? ` [renombrar a "${m.finalName}"]` : '';
    console.log(
      `  conservar "${m.keep.name}"${renamed} <- eliminar [${m.drop.map((d) => d.name).join(', ')}]${
        moved.length ? ` (mueve: ${moved.join(', ')})` : ''
      }`,
    );
  }

  if (renames.length) {
    console.log(`\nrenombrados sueltos: ${renames.length}`);
    for (const r of renames) console.log(`  "${r.from}" -> "${r.to}"`);
  }

  const removed = merges.reduce((s, m) => s + m.drop.length, 0);
  console.log(`\nquedarian ${globals.length - removed} empresas globales (se eliminan ${removed})`);

  if (!apply) {
    console.log('\nUsa --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  for (const m of merges) {
    for (const d of m.drop) {
      await prisma.company.updateMany({ where: { globalCompanyId: d.id }, data: { globalCompanyId: m.keep.id } });
      await prisma.globalClient.updateMany({ where: { globalCompanyId: d.id }, data: { globalCompanyId: m.keep.id } });
      await prisma.globalCompany.update({ where: { id: d.id }, data: { deletedAt: new Date() } });
    }
    if (m.finalName !== m.keep.name) {
      await prisma.globalCompany.update({ where: { id: m.keep.id }, data: { name: m.finalName } });
    }
  }

  for (const r of renames) {
    await prisma.globalCompany.update({ where: { id: r.id }, data: { name: r.to } });
  }

  console.log(`\nfusionadas: ${removed} empresas eliminadas, ${renames.length} renombradas`);
  await prisma.$disconnect();
}

main();

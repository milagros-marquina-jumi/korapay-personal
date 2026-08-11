import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE = 'D:/projects-code/MIMOTECH/Mi-Bolsillito/Recursos/korapay-personal/markdown/IngresosM_Empresas.md';

interface Instance {
  official: string;
  instance: string;
  startDate: string;
  endDate: string | null;
}

// Cada valor distinto de la columna "Empresas" es un contrato independiente de la
// "Empresa Oficial"; las fechas de inicio y fin llegan en filas separadas.
function readInstances(): Instance[] {
  const rows = readFileSync(SOURCE, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| 20'))
    .map((l) => l.split('|').map((c) => c.trim()));

  const byInstance = new Map<string, Instance>();
  for (const row of rows) {
    const official = row[5];
    const instance = row[6];
    const start = row[8];
    const end = row[9];
    if (!official || !instance) continue;

    const entry = byInstance.get(instance) ?? { official, instance, startDate: '', endDate: null };
    if (start) entry.startDate = start;
    if (end) entry.endDate = end;
    byInstance.set(instance, entry);
  }

  return [...byInstance.values()].filter((i) => i.startDate);
}

interface Update {
  id: string;
  company: string;
  instance: string;
  startDate: Date;
  endDate: Date | null;
  position: string | null;
}

interface ContractRow {
  id: string;
  startDate: Date;
  endDate: Date | null;
  position: string | null;
}

// El n-esimo contrato por fecha corresponde a la n-esima instancia del origen.
function pairUp(company: string, list: Instance[], rows: ContractRow[], instanceNames: Set<string>): Update[] {
  const ordered = [...list].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const updates: Update[] = [];

  ordered.forEach((inst, idx) => {
    const row = rows[idx];
    if (!row) return;

    const sameStart = row.startDate.toISOString().slice(0, 10) === inst.startDate;
    const sameEnd = (row.endDate?.toISOString().slice(0, 10) ?? null) === inst.endDate;

    // La migracion original guardo el nombre de la instancia en position y puede estar cruzado.
    // Solo se reescribe si el valor actual ya es un nombre de instancia, nunca un cargo real.
    const holdsInstanceName = !!row.position && instanceNames.has(row.position);
    const position = holdsInstanceName && row.position !== inst.instance ? inst.instance : null;

    if (sameStart && sameEnd && !position) return;
    updates.push({
      id: row.id,
      company,
      instance: inst.instance,
      startDate: new Date(`${inst.startDate}T00:00:00.000Z`),
      endDate: inst.endDate ? new Date(`${inst.endDate}T00:00:00.000Z`) : null,
      position,
    });
  });

  return updates;
}

interface BuildInput {
  byOfficial: Map<string, Instance[]>;
  contracts: (ContractRow & { companyId: string | null })[];
  nameOf: Map<string, string>;
  instanceNames: Set<string>;
}

function buildUpdates({ byOfficial, contracts, nameOf, instanceNames }: BuildInput) {
  const updates: Update[] = [];
  const skipped: string[] = [];

  for (const [official, list] of byOfficial.entries()) {
    if (list.length < 2) continue;

    const rows = contracts
      .filter((c) => (nameOf.get(c.companyId ?? '') ?? '').toUpperCase() === official)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime() || a.id.localeCompare(b.id));

    if (rows.length !== list.length) {
      skipped.push(`${official}: ${rows.length} contratos en BD vs ${list.length} instancias en el origen`);
      continue;
    }

    updates.push(...pairUp(official, list, rows, instanceNames));
  }

  return { updates, skipped };
}

function describe(u: Update) {
  const start = u.startDate.toISOString().slice(0, 10);
  const end = u.endDate?.toISOString().slice(0, 10) ?? 'ACTIVO';
  const label = u.position ? ` (corrige etiqueta a "${u.position}")` : '';
  return `  ${u.company} [${u.instance}] -> ${start} .. ${end}${label}`;
}

function groupByOfficial(instances: Instance[]) {
  const byOfficial = new Map<string, Instance[]>();
  for (const i of instances) {
    const key = i.official.toUpperCase();
    const bucket = byOfficial.get(key) ?? [];
    bucket.push(i);
    byOfficial.set(key, bucket);
  }
  return byOfficial;
}

async function main() {
  const apply = process.argv.includes('--apply');

  const workspace = await prisma.workspace.findFirst({ where: { type: 'EMPLOYMENT', deletedAt: null } });
  if (!workspace) throw new Error('Sin workspace EMPLOYMENT');

  const [contracts, companies] = await Promise.all([
    prisma.employmentContract.findMany({ where: { workspaceId: workspace.id, deletedAt: null } }),
    prisma.company.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);
  const nameOf = new Map(companies.map((c) => [c.id, c.name]));

  const instances = readInstances();
  const instanceNames = new Set(instances.map((i) => i.instance));
  const byOfficial = groupByOfficial(instances);

  const { updates, skipped } = buildUpdates({ byOfficial, contracts, nameOf, instanceNames });

  console.log(`contratos: ${contracts.length}`);
  console.log(`empresas con reingreso en el origen: ${[...byOfficial.values()].filter((v) => v.length > 1).length}`);
  console.log(`contratos a corregir: ${updates.length}`);
  for (const u of updates) console.log(describe(u));
  if (skipped.length) {
    console.log(`\nsin tocar: ${skipped.length}`);
    for (const s of skipped) console.log(`  ${s}`);
  }

  if (!apply) {
    console.log('\nUsa --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  for (const u of updates) {
    await prisma.employmentContract.update({
      where: { id: u.id },
      data: {
        startDate: u.startDate,
        endDate: u.endDate,
        status: u.endDate ? 'FINISHED' : 'ACTIVE',
        ...(u.position ? { position: u.position } : {}),
      },
    });
  }

  console.log(`\nactualizados: ${updates.length} contratos`);
  await prisma.$disconnect();
}

main();

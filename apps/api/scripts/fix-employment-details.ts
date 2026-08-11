import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'D:/projects-code/MIMOTECH/Mi-Bolsillito/Recursos/korapay-personal/markdown';
const _MONTHS = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

function readRows(file: string) {
  return readFileSync(`${BASE}/${file}`, 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('| 20'))
    .map((l) => l.split('|').map((c) => c.trim()));
}

interface TxUpdate {
  id: string;
  tags: string[];
  bank: string | null;
  account: string | null;
  status: string;
}

interface Tx {
  id: string;
  date: Date;
  concept: string;
  tags: string[];
  notes: string | null;
  status: string;
  company: { name: string } | null;
}

function buildTxUpdates(transactions: Tx[]): TxUpdate[] {
  const used = new Set<string>();
  const updates: TxUpdate[] = [];
  const byName = (a: string, b: string) => a.localeCompare(b);

  for (const row of readRows('IngresosM_Trabajos.md')) {
    const [, date, , , , , , concept, company, payType, , , , , bank, account, status] = row;
    const match = transactions.find(
      (t) =>
        !used.has(t.id) &&
        t.date.toISOString().slice(0, 10) === date &&
        t.concept === concept &&
        (t.company?.name ?? '') === company,
    );
    if (!match) continue;
    used.add(match.id);

    // Tags limpios: modalidad de pago + banco. Fuera los nombres de mes.
    const tags: string[] = [];
    if (payType) tags.push(payType);
    if (bank && bank !== payType) tags.push(bank);

    const cleanAccount = (account ?? '').replaceAll('<br>', ' ').trim() || null;
    const newStatus = status === 'Pagado' ? 'PAID' : 'PENDING';
    const sameTags = JSON.stringify([...match.tags].sort(byName)) === JSON.stringify([...tags].sort(byName));
    if (sameTags && match.notes === cleanAccount && match.status === newStatus) continue;

    updates.push({ id: match.id, tags, bank: bank || null, account: cleanAccount, status: newStatus });
  }
  return updates;
}

function readContractDates() {
  const endByCompany = new Map<string, string>();
  const startByCompany = new Map<string, string>();
  for (const row of readRows('IngresosM_Empresas.md')) {
    const [, , , , , company, , , start, end] = row;
    if (company && start) startByCompany.set(company, start);
    if (company && end) endByCompany.set(company, end);
  }
  return { startByCompany, endByCompany };
}

interface ContractRow {
  id: string;
  companyId: string | null;
  startDate: Date;
  endDate: Date | null;
}

function buildContractUpdates(contracts: ContractRow[], companies: { id: string; name: string }[]) {
  const { startByCompany, endByCompany } = readContractDates();
  const companyName = new Map(companies.map((c) => [c.id, c.name]));
  const updates: { id: string; company: string; endDate: Date | null; startDate: Date | null }[] = [];

  for (const c of contracts) {
    const name = companyName.get(c.companyId ?? '') ?? '';
    const end = endByCompany.get(name);
    const start = startByCompany.get(name);
    const endChanged = end && c.endDate?.toISOString().slice(0, 10) !== end;
    const startChanged = start && c.startDate?.toISOString().slice(0, 10) !== start;
    if (!endChanged && !startChanged) continue;
    updates.push({
      id: c.id,
      company: name,
      endDate: endChanged ? new Date(`${end}T00:00:00.000Z`) : c.endDate,
      startDate: startChanged ? new Date(`${start}T00:00:00.000Z`) : c.startDate,
    });
  }
  return updates;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const workspace = await prisma.workspace.findFirst({ where: { type: 'EMPLOYMENT', deletedAt: null } });
  if (!workspace) throw new Error('Sin workspace EMPLOYMENT');

  const transactions = await prisma.transaction.findMany({
    where: { workspaceId: workspace.id, deletedAt: null, type: 'INCOME' },
    include: { company: { select: { name: true } } },
  });

  const txUpdates = buildTxUpdates(transactions);

  const [contracts, companies] = await Promise.all([
    prisma.employmentContract.findMany({ where: { workspaceId: workspace.id, deletedAt: null } }),
    prisma.company.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
      select: { id: true, name: true },
    }),
  ]);
  const contractUpdates = buildContractUpdates(contracts, companies);

  console.log(`transacciones a corregir: ${txUpdates.length} de ${transactions.length}`);
  console.log(`contratos a corregir: ${contractUpdates.length} de ${contracts.length}`);

  if (!apply) {
    console.log('\nsimulacion. Ejemplos de transacciones:');
    for (const u of txUpdates.slice(0, 4)) {
      console.log(`  tags: ${JSON.stringify(u.tags)} | banco: ${u.bank} | estado: ${u.status}`);
    }
    console.log('Ejemplos de contratos:');
    for (const u of contractUpdates.slice(0, 4)) {
      console.log(
        `  ${u.company}: inicio ${u.startDate?.toISOString().slice(0, 10)} fin ${u.endDate?.toISOString().slice(0, 10)}`,
      );
    }
    console.log('\nUsa --apply para escribir.');
    await prisma.$disconnect();
    return;
  }

  for (const u of txUpdates) {
    await prisma.transaction.update({
      where: { id: u.id },
      data: { tags: u.tags, notes: u.account, status: u.status },
    });
  }
  for (const u of contractUpdates) {
    await prisma.employmentContract.update({
      where: { id: u.id },
      data: { endDate: u.endDate, startDate: u.startDate ?? undefined },
    });
  }
  console.log(`\nactualizadas: ${txUpdates.length} transacciones, ${contractUpdates.length} contratos`);
  await prisma.$disconnect();
}

main();

import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const ws = await p.workspace.findFirst({ where: { type: 'EMPLOYMENT' } });
  if (!ws) {
    console.log('No workspace Empleos');
    await p.$disconnect();
    return;
  }

  // Fix companies that have contract variants (LLATAN 1/2, SOLMIT 1/2)
  const companies = await p.company.findMany({
    where: { workspaceId: ws.id },
    select: { id: true, name: true },
  });

  for (const company of companies) {
    // Find contracts for this company
    const contracts = await p.employmentContract.findMany({
      where: { companyId: company.id, deletedAt: null },
      orderBy: { startDate: 'asc' },
    });

    if (contracts.length <= 1) continue;

    // Find clients that are variants of this company name
    const variants = await p.client.findMany({
      where: {
        companyId: company.id,
        name: { startsWith: company.name },
      },
    });

    if (variants.length === 0) continue;

    // Map variants to contracts by start date
    for (const variant of variants) {
      const number = variant.name.replace(company.name, '').trim();
      if (!number) continue;

      // Find matching contract by position in order
      const idx = Number(number) - 1;
      if (idx >= 0 && idx < contracts.length) {
        await p.employmentContract.update({
          where: { id: contracts[idx].id },
          data: { position: variant.name },
        });
        console.log(`  Contrato ${variant.name}: ${contracts[idx].startDate.toISOString().slice(0, 10)} actualizado`);
        contractCount++;
      }
    }

    // Delete the variant client records
    const deleted = await p.client.deleteMany({
      where: {
        companyId: company.id,
        name: { in: variants.map((v) => v.name) },
      },
    });

    if (deleted.count > 0 || contractCount > 0) {
      console.log(`${company.name}: ${contractCount} contratos, ${deleted.count} clientes eliminados`);
    }
  }

  await p.$disconnect();
}

let contractCount = 0;
main().catch((e) => {
  console.error(e);
  p.$disconnect();
  process.exit(1);
});

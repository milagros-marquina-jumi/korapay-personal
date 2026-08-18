import type { PrismaService } from '@/common/prisma/prisma.service';

export async function sincronizarEmpresaCliente(
  prisma: PrismaService,
  companyName?: string | null,
  clientName?: string | null,
): Promise<void> {
  const empresa = companyName?.trim();
  const cliente = clientName?.trim();
  if (!empresa && !cliente) return;

  let globalCompanyId: string | null = null;
  if (empresa) {
    // Preferir siempre la fila activa: si existe una activa y otra soft-deleted con el
    // mismo nombre, revivir la borrada recrea empresas duplicadas en el catalogo.
    const existente =
      (await prisma.globalCompany.findFirst({
        where: { name: { equals: empresa, mode: 'insensitive' }, deletedAt: null },
        select: { id: true, deletedAt: true },
      })) ??
      (await prisma.globalCompany.findFirst({
        where: { name: { equals: empresa, mode: 'insensitive' } },
        select: { id: true, deletedAt: true },
      }));
    if (existente) {
      globalCompanyId = existente.id;
      if (existente.deletedAt) {
        await prisma.globalCompany.update({ where: { id: existente.id }, data: { deletedAt: null } });
      }
    } else {
      globalCompanyId = (await prisma.globalCompany.create({ data: { name: empresa } })).id;
    }
  }

  if (!cliente) return;

  const clienteExistente =
    (await prisma.globalClient.findFirst({
      where: { name: { equals: cliente, mode: 'insensitive' }, deletedAt: null },
      select: { id: true, globalCompanyId: true, deletedAt: true },
    })) ??
    (await prisma.globalClient.findFirst({
      where: { name: { equals: cliente, mode: 'insensitive' } },
      select: { id: true, globalCompanyId: true, deletedAt: true },
    }));

  let globalClientId: string;
  if (clienteExistente) {
    globalClientId = clienteExistente.id;
    const cambios: { deletedAt?: null; globalCompanyId?: string } = {};
    if (clienteExistente.deletedAt) cambios.deletedAt = null;
    if (globalCompanyId && !clienteExistente.globalCompanyId) cambios.globalCompanyId = globalCompanyId;
    if (Object.keys(cambios).length) {
      await prisma.globalClient.update({ where: { id: globalClientId }, data: cambios });
    }
  } else {
    globalClientId = (await prisma.globalClient.create({ data: { name: cliente, globalCompanyId } })).id;
  }

  if (globalCompanyId) {
    await prisma.globalCompanyClient.upsert({
      where: { globalCompanyId_globalClientId: { globalCompanyId, globalClientId } },
      create: { globalCompanyId, globalClientId },
      update: {},
    });
  }
}

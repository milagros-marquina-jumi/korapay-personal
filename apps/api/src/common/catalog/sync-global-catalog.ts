import type { PrismaService } from '@/common/prisma/prisma.service';

/**
 * Deja empresa y cliente registrados en el catalogo global y los asocia entre si.
 * Los contratos de talento guardan nombres, no ids, asi que la busqueda es por nombre.
 *
 * El nombre es unico en base de datos incluso para filas borradas, por eso una
 * coincidencia con deletedAt se revive en vez de crear un duplicado.
 *
 * La relacion vive en globalCompanyClient: un cliente puede trabajar con varias
 * empresas. globalCompanyId se mantiene como la empresa principal, util para
 * ordenar y para el codigo que aun lee el campo escalar.
 */
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
    const existente = await prisma.globalCompany.findFirst({
      where: { name: { equals: empresa, mode: 'insensitive' } },
      select: { id: true, deletedAt: true },
    });
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

  const clienteExistente = await prisma.globalClient.findFirst({
    where: { name: { equals: cliente, mode: 'insensitive' } },
    select: { id: true, globalCompanyId: true, deletedAt: true },
  });

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

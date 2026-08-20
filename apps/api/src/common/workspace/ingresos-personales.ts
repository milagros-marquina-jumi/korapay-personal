import type { PrismaService } from '@/common/prisma/prisma.service';

export async function workspacesDeIngresoPersonal(prisma: PrismaService, workspaceId: string): Promise<string[]> {
  const actual = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    select: { type: true, members: { select: { profileId: true, role: true } } },
  });
  if (actual?.type !== 'PERSONAL') return [];
  const ownerId = actual.members.find((m) => m.role === 'OWNER')?.profileId ?? actual.members[0]?.profileId;
  if (!ownerId) return [];
  const laborales = await prisma.workspace.findMany({
    where: {
      type: 'EMPLOYMENT',
      deletedAt: null,
      id: { not: workspaceId },
      members: { some: { profileId: ownerId } },
    },
    select: { id: true },
  });
  return laborales.map((w) => w.id);
}

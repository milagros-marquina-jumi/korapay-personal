import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(profileId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { profileId },
      include: { workspace: true },
    });
    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }
  async findOne(id: string, profileId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_profileId: { workspaceId: id, profileId } },
      include: { workspace: true },
    });
    if (!membership) throw new NotFoundException('Workspace not found');
    return { ...membership.workspace, role: membership.role };
  }
  async create(data: { name: string; type: string; currency?: string; profileId: string }) {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        type: data.type,
        currency: data.currency ?? 'PEN',
      },
    });
    await this.prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        profileId: data.profileId,
        role: 'OWNER',
      },
    });
    return workspace;
  }
  async update(id: string, data: { name?: string; description?: string; emoji?: string }) {
    return this.prisma.workspace.update({
      where: { id },
      data,
    });
  }
  async remove(id: string) {
    return this.prisma.workspace.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }
  async getMembers(workspaceId: string) {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { profile: true },
    });
  }
}

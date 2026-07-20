import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(workspaceId: string) {
    return this.prisma.company.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
  async create(data: { workspaceId: string; name: string; ruc?: string; industry?: string }) {
    return this.prisma.company.create({ data });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const company = await this.prisma.company.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!company) throw new NotFoundException('Company not found');
    return this.prisma.company.update({ where: { id }, data: data as any });
  }
  async remove(id: string, workspaceId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!company) throw new NotFoundException('Company not found');
    return this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

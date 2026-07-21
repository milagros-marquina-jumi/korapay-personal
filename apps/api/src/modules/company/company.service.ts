import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
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
    const dup = await this.prisma.company.findFirst({
      where: { workspaceId: data.workspaceId, name: { equals: data.name, mode: 'insensitive' }, deletedAt: null },
    });
    if (dup) throw new ConflictException('Ya existe una empresa con ese nombre');
    return this.prisma.company.create({ data });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const company = await this.prisma.company.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (typeof data.name === 'string') {
      const dup = await this.prisma.company.findFirst({
        where: { workspaceId, name: { equals: data.name, mode: 'insensitive' }, deletedAt: null, id: { not: id } },
      });
      if (dup) throw new ConflictException('Ya existe una empresa con ese nombre');
    }
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

import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(workspaceId: string) {
    return this.prisma.category.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
  async create(data: { workspaceId: string; name: string; emoji?: string; color?: string; parentId?: string }) {
    return this.prisma.category.create({ data });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const cat = await this.prisma.category.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data: data as any });
  }
  async remove(id: string, workspaceId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class PersonService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(workspaceId: string, kind?: string) {
    return this.prisma.person.findMany({
      where: { workspaceId, deletedAt: null, ...(kind && { kind }) },
      orderBy: { name: 'asc' },
    });
  }
  async create(data: {
    workspaceId: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    kind?: string;
  }) {
    return this.prisma.person.create({ data });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const person = await this.prisma.person.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!person) throw new NotFoundException('Person not found');
    return this.prisma.person.update({ where: { id }, data: data as any });
  }
  async remove(id: string, workspaceId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!person) throw new NotFoundException('Person not found');
    return this.prisma.person.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

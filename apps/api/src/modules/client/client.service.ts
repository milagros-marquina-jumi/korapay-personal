import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { UpdateClientDto } from './client.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(workspaceId: string, companyId?: string) {
    return this.prisma.client.findMany({
      where: { workspaceId, deletedAt: null, ...(companyId && { companyId }) },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: {
    workspaceId: string;
    companyId?: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) {
    const dup = await this.prisma.client.findFirst({
      where: {
        workspaceId: data.workspaceId,
        companyId: data.companyId ?? null,
        name: { equals: data.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (dup) throw new ConflictException('Ya existe un cliente con ese nombre en esta empresa');
    return this.prisma.client.create({ data });
  }

  async update(id: string, workspaceId: string, data: UpdateClientDto) {
    const found = await this.prisma.client.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Cliente no encontrado');
    if (typeof data.name === 'string') {
      const dup = await this.prisma.client.findFirst({
        where: {
          workspaceId,
          companyId: (data.companyId as string | undefined) ?? found.companyId,
          name: { equals: data.name, mode: 'insensitive' },
          deletedAt: null,
          id: { not: id },
        },
      });
      if (dup) throw new ConflictException('Ya existe un cliente con ese nombre en esta empresa');
    }
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(id: string, workspaceId: string) {
    const found = await this.prisma.client.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

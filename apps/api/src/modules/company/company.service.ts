import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { UpdateCompanyDto } from './company.dto';
@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(workspaceId: string) {
    const companies = await this.prisma.company.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { clients: { where: { deletedAt: null } } } },
        globalCompany: { select: { id: true, name: true, ruc: true } },
      },
    });
    return companies.map((c) => {
      const { _count, ...rest } = c;
      return { ...rest, clientCount: _count.clients };
    });
  }
  async create(data: {
    workspaceId: string;
    name: string;
    globalCompanyId?: string;
    ruc?: string;
    industry?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const dup = await this.prisma.company.findFirst({
      where: { workspaceId: data.workspaceId, name: { equals: data.name, mode: 'insensitive' }, deletedAt: null },
    });
    if (dup) throw new ConflictException('Ya existe una empresa con ese nombre');
    return this.prisma.company.create({
      data: {
        workspaceId: data.workspaceId,
        globalCompanyId: data.globalCompanyId || null,
        name: data.name,
        ruc: data.ruc,
        industry: data.industry,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }
  async update(id: string, workspaceId: string, data: UpdateCompanyDto) {
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
    const updateData: Prisma.CompanyUpdateInput = {};
    for (const key of ['name', 'ruc', 'industry'] as const) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.globalCompanyId !== undefined) {
      updateData.globalCompany = data.globalCompanyId
        ? { connect: { id: data.globalCompanyId } }
        : { disconnect: true };
    }
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    return this.prisma.company.update({ where: { id }, data: updateData });
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

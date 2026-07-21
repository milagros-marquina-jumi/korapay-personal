import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  applications(workspaceId: string) {
    return this.prisma.application.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createApplication(data: {
    workspaceId: string;
    name: string;
    provider?: string;
    category?: string;
    url?: string;
  }) {
    const dup = await this.prisma.application.findFirst({
      where: { workspaceId: data.workspaceId, name: { equals: data.name, mode: 'insensitive' }, deletedAt: null },
    });
    if (dup) throw new ConflictException('Ya existe una aplicación con ese nombre');
    return this.prisma.application.create({ data });
  }

  async updateApplication(id: string, workspaceId: string, data: Record<string, unknown>) {
    const found = await this.prisma.application.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Application not found');
    if (typeof data.name === 'string') {
      const dup = await this.prisma.application.findFirst({
        where: { workspaceId, name: { equals: data.name, mode: 'insensitive' }, deletedAt: null, id: { not: id } },
      });
      if (dup) throw new ConflictException('Ya existe una aplicación con ese nombre');
    }
    return this.prisma.application.update({ where: { id }, data: data as never });
  }

  async removeApplication(id: string, workspaceId: string) {
    const found = await this.prisma.application.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Application not found');
    return this.prisma.application.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  projects(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createProject(data: { workspaceId: string; name: string; description?: string; emoji?: string }) {
    const dup = await this.prisma.project.findFirst({
      where: { workspaceId: data.workspaceId, name: { equals: data.name, mode: 'insensitive' }, deletedAt: null },
    });
    if (dup) throw new ConflictException('Ya existe un proyecto con ese nombre');
    return this.prisma.project.create({ data });
  }

  async updateProject(id: string, workspaceId: string, data: Record<string, unknown>) {
    const found = await this.prisma.project.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Project not found');
    if (typeof data.name === 'string') {
      const dup = await this.prisma.project.findFirst({
        where: { workspaceId, name: { equals: data.name, mode: 'insensitive' }, deletedAt: null, id: { not: id } },
      });
      if (dup) throw new ConflictException('Ya existe un proyecto con ese nombre');
    }
    return this.prisma.project.update({ where: { id }, data: data as never });
  }

  async removeProject(id: string, workspaceId: string) {
    const found = await this.prisma.project.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Project not found');
    return this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async employmentContracts(workspaceId: string) {
    const contracts = await this.prisma.employmentContract.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { startDate: 'desc' },
    });
    return contracts.map((c) => ({ ...c, salary: c.salary?.toString() ?? null }));
  }

  paymentMethods() {
    return this.prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } });
  }

  async createPaymentMethod(data: { name: string }) {
    const dup = await this.prisma.paymentMethod.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (dup) throw new ConflictException('Ya existe un medio de pago con ese nombre');
    return this.prisma.paymentMethod.create({ data });
  }

  async updatePaymentMethod(id: string, data: { name: string }) {
    const found = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Payment method not found');
    const dup = await this.prisma.paymentMethod.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' }, id: { not: id } },
    });
    if (dup) throw new ConflictException('Ya existe un medio de pago con ese nombre');
    return this.prisma.paymentMethod.update({ where: { id }, data });
  }

  async removePaymentMethod(id: string) {
    const found = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Payment method not found');
    return this.prisma.paymentMethod.delete({ where: { id } });
  }

  currencies() {
    return this.prisma.currency.findMany({ orderBy: { code: 'asc' } });
  }

  async createCurrency(data: { code: string; symbol: string; name: string }) {
    const dup = await this.prisma.currency.findFirst({
      where: { code: { equals: data.code, mode: 'insensitive' } },
    });
    if (dup) throw new ConflictException('Ya existe una moneda con ese código');
    return this.prisma.currency.create({ data });
  }

  async removeCurrency(id: string) {
    const found = await this.prisma.currency.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Currency not found');
    return this.prisma.currency.delete({ where: { id } });
  }

  banks() {
    return this.prisma.bank.findMany({ orderBy: { name: 'asc' } });
  }

  async createBank(data: { name: string; country?: string }) {
    const dup = await this.prisma.bank.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (dup) throw new ConflictException('Ya existe un banco con ese nombre');
    return this.prisma.bank.create({ data: { name: data.name, country: data.country ?? 'PE' } });
  }

  async updateBank(id: string, data: { name?: string; country?: string }) {
    const found = await this.prisma.bank.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Bank not found');
    if (typeof data.name === 'string') {
      const dup = await this.prisma.bank.findFirst({
        where: { name: { equals: data.name, mode: 'insensitive' }, id: { not: id } },
      });
      if (dup) throw new ConflictException('Ya existe un banco con ese nombre');
    }
    return this.prisma.bank.update({ where: { id }, data });
  }

  async removeBank(id: string) {
    const found = await this.prisma.bank.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Bank not found');
    return this.prisma.bank.delete({ where: { id } });
  }
}

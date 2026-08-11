import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ContractIncomeService } from './contract-income.service';
import { buildContractSequence, buildGrossByCompany, deriveContractState } from './contract-state';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contractIncome: ContractIncomeService,
  ) {}

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
    const [contracts, companies, salaries] = await Promise.all([
      this.prisma.employmentContract.findMany({
        where: { workspaceId, deletedAt: null },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.company.findMany({
        where: { workspaceId, deletedAt: null },
        select: { id: true, name: true },
      }),
      this.prisma.transaction.findMany({
        where: { workspaceId, deletedAt: null, type: 'INCOME', concept: 'Sueldo', companyId: { not: null } },
        select: { companyId: true, date: true, amountGross: true, amountBase: true },
      }),
    ]);

    const companyName = new Map(companies.map((c) => [c.id, c.name]));
    const grossByCompany = buildGrossByCompany(salaries);

    const sequence = buildContractSequence(contracts);

    return contracts.map((c) => ({
      ...c,
      salary: c.salary?.toString() ?? null,
      companyName: companyName.get(c.companyId ?? '') ?? null,
      grossSalary: grossByCompany.get(c.companyId ?? '') ?? null,
      ...(sequence.get(c.id) ?? { sequence: 1, sequenceTotal: 1 }),
      ...deriveContractState(c.endDate),
    }));
  }

  async createEmploymentContract(data: {
    workspaceId: string;
    companyId?: string;
    position?: string;
    type?: string;
    startDate: string;
    endDate?: string;
    salary?: string;
    currency?: string;
    notes?: string;
  }) {
    const created = await this.prisma.employmentContract.create({
      data: {
        workspaceId: data.workspaceId,
        companyId: data.companyId ?? null,
        position: data.position ?? null,
        type: data.type ?? null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        salary: data.salary ?? null,
        currency: data.currency ?? 'PEN',
        status: deriveContractState(data.endDate ? new Date(data.endDate) : null).state,
        notes: data.notes ?? null,
      },
    });
    await this.contractIncome.syncContractIncomes(created.id, data.workspaceId);
    return { ...created, salary: created.salary?.toString() ?? null };
  }

  async updateEmploymentContract(id: string, workspaceId: string, data: Record<string, unknown>) {
    const found = await this.prisma.employmentContract.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Contrato no encontrado');
    const updateData: Record<string, unknown> = {};
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate as string);
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate as string) : null;
      updateData.status = deriveContractState(data.endDate ? new Date(data.endDate as string) : null).state;
    }
    if (data.salary !== undefined) updateData.salary = data.salary;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.notes !== undefined) updateData.notes = data.notes;
    const updated = await this.prisma.employmentContract.update({ where: { id }, data: updateData as never });
    await this.contractIncome.syncContractIncomes(id, workspaceId);
    return { ...updated, salary: updated.salary?.toString() ?? null };
  }

  async removeEmploymentContract(id: string, workspaceId: string) {
    const found = await this.prisma.employmentContract.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Contrato no encontrado');
    await this.contractIncome.removeFutureIncomes(id, workspaceId);
    return this.prisma.employmentContract.update({ where: { id }, data: { deletedAt: new Date() } });
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

  globalCompanies() {
    return this.prisma.globalCompany.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        clients: { where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } },
      },
    });
  }

  async createGlobalCompany(data: { name: string; ruc?: string }) {
    const dup = await this.prisma.globalCompany.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' }, deletedAt: null },
    });
    if (dup) throw new ConflictException('Ya existe una empresa con ese nombre');
    return this.prisma.globalCompany.create({ data: { name: data.name, ruc: data.ruc ?? null } });
  }

  async updateGlobalCompany(id: string, data: { name?: string; ruc?: string }) {
    const found = await this.prisma.globalCompany.findFirst({ where: { id, deletedAt: null } });
    if (!found) throw new NotFoundException('Empresa no encontrada');
    if (typeof data.name === 'string') {
      const dup = await this.prisma.globalCompany.findFirst({
        where: { name: { equals: data.name, mode: 'insensitive' }, deletedAt: null, id: { not: id } },
      });
      if (dup) throw new ConflictException('Ya existe una empresa con ese nombre');
    }
    return this.prisma.globalCompany.update({ where: { id }, data });
  }

  async removeGlobalCompany(id: string) {
    const found = await this.prisma.globalCompany.findFirst({ where: { id, deletedAt: null } });
    if (!found) throw new NotFoundException('Empresa no encontrada');
    return this.prisma.globalCompany.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  globalClients() {
    return this.prisma.globalClient.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: { globalCompany: { select: { id: true, name: true } } },
    });
  }

  async createGlobalClient(data: { name: string; globalCompanyId?: string }) {
    const dup = await this.prisma.globalClient.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' }, deletedAt: null },
    });
    if (dup) throw new ConflictException('Ya existe un cliente con ese nombre');
    return this.prisma.globalClient.create({
      data: { name: data.name, globalCompanyId: data.globalCompanyId || null },
      include: { globalCompany: { select: { id: true, name: true } } },
    });
  }

  async updateGlobalClient(id: string, data: { name?: string; globalCompanyId?: string | null }) {
    const found = await this.prisma.globalClient.findFirst({ where: { id, deletedAt: null } });
    if (!found) throw new NotFoundException('Cliente no encontrado');
    if (typeof data.name === 'string') {
      const dup = await this.prisma.globalClient.findFirst({
        where: { name: { equals: data.name, mode: 'insensitive' }, deletedAt: null, id: { not: id } },
      });
      if (dup) throw new ConflictException('Ya existe un cliente con ese nombre');
    }
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.globalCompanyId !== undefined) updateData.globalCompanyId = data.globalCompanyId || null;
    return this.prisma.globalClient.update({
      where: { id },
      data: updateData as never,
      include: { globalCompany: { select: { id: true, name: true } } },
    });
  }

  async removeGlobalClient(id: string) {
    const found = await this.prisma.globalClient.findFirst({ where: { id, deletedAt: null } });
    if (!found) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.globalClient.update({ where: { id }, data: { deletedAt: new Date() } });
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

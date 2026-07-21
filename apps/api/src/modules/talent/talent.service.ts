import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class TalentService {
  constructor(private readonly prisma: PrismaService) {}
  async generateAccessToken(id: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!talent) throw new NotFoundException('Talent not found');
    const token = randomBytes(24).toString('base64url');
    return this.prisma.talentProfile.update({
      where: { id },
      data: { accessToken: token, tokenEnabledAt: new Date() },
    });
  }
  async revokeAccessToken(id: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!talent) throw new NotFoundException('Talent not found');
    return this.prisma.talentProfile.update({
      where: { id },
      data: { accessToken: null, tokenEnabledAt: null },
    });
  }
  async findAll(workspaceId: string) {
    return this.prisma.talentProfile.findMany({
      where: { workspaceId, deletedAt: null },
      include: { contracts: true },
      orderBy: { name: 'asc' },
    });
  }
  async findOne(id: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { contracts: { include: { incomeDistributions: true } } },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    return talent;
  }
  private mapTalentData(data: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of ['name', 'email', 'phone', 'notes', 'status', 'role', 'studyPlace', 'slideUrl'] as const) {
      if (data[key] !== undefined) out[key] = data[key];
    }
    for (const key of ['startedWithMeAt', 'endedWithMeAt', 'firstJobAt', 'studyStartAt', 'studyEndAt'] as const) {
      if (data[key] !== undefined) out[key] = data[key] ? new Date(data[key] as string) : null;
    }
    return out;
  }
  async create(data: Record<string, unknown>) {
    return this.prisma.talentProfile.create({
      data: { workspaceId: data.workspaceId as string, ...this.mapTalentData(data) } as never,
    });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    return this.prisma.talentProfile.update({
      where: { id },
      data: this.mapTalentData(data) as never,
    });
  }
  async remove(id: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    return this.prisma.talentProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  async addContract(
    talentProfileId: string,
    workspaceId: string,
    data: {
      companyName?: string;
      clientName?: string;
      position?: string;
      paymentType?: string;
      rate?: string;
      currency?: string;
      startDate: string;
      endDate?: string;
      status?: string;
      notes?: string;
    },
  ) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id: talentProfileId, workspaceId, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    return this.prisma.talentContract.create({
      data: {
        talentProfileId,
        companyName: data.companyName ?? null,
        clientName: data.clientName ?? null,
        position: data.position ?? null,
        paymentType: data.paymentType ?? null,
        rate: data.rate ?? null,
        currency: data.currency ?? 'PEN',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status ?? (data.endDate ? 'FINISHED' : 'ACTIVE'),
        notes: data.notes ?? null,
      },
    });
  }
  async updateContract(contractId: string, workspaceId: string, data: Record<string, unknown>) {
    const contract = await this.prisma.talentContract.findFirst({
      where: { id: contractId, talentProfile: { workspaceId, deletedAt: null } },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    const updateData: Record<string, unknown> = {};
    for (const key of [
      'companyName',
      'clientName',
      'position',
      'paymentType',
      'rate',
      'currency',
      'status',
      'notes',
    ] as const) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate as string);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate as string) : null;
    return this.prisma.talentContract.update({ where: { id: contractId }, data: updateData as never });
  }
  async removeContract(contractId: string, workspaceId: string) {
    const contract = await this.prisma.talentContract.findFirst({
      where: { id: contractId, talentProfile: { workspaceId, deletedAt: null } },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.prisma.talentContract.delete({ where: { id: contractId } });
  }
  async addDistribution(contractId: string, workspaceId: string, data: Record<string, unknown>) {
    const contract = await this.prisma.talentContract.findFirst({
      where: { id: contractId, talentProfile: { workspaceId, deletedAt: null } },
    });
    if (!contract) throw new NotFoundException('Talent contract not found');
    const d = data.date ? new Date(data.date as string) : null;
    return this.prisma.talentIncomeDistribution.create({
      data: {
        contractId,
        transactionId: (data.transactionId as string) ?? null,
        date: d,
        year: data.year != null ? (data.year as number) : (d?.getUTCFullYear() ?? null),
        month: data.month != null ? (data.month as number) : d ? d.getUTCMonth() + 1 : null,
        paymentType: (data.paymentType as string) ?? 'Mensual',
        salary: (data.salary as string) ?? null,
        amountWithDiscount: data.amountWithDiscount as string,
        amountReceived: data.amountReceived as string,
        amountRetained: data.amountRetained as string,
        notes: (data.notes as string) ?? null,
        status: (data.status as string) ?? 'PENDING',
      },
    });
  }
  async updateDistribution(distId: string, workspaceId: string, data: Record<string, unknown>) {
    const dist = await this.prisma.talentIncomeDistribution.findFirst({
      where: { id: distId, contract: { talentProfile: { workspaceId, deletedAt: null } } },
    });
    if (!dist) throw new NotFoundException('Distribution not found');
    const updateData: Record<string, unknown> = {};
    for (const key of [
      'paymentType',
      'salary',
      'amountWithDiscount',
      'amountReceived',
      'amountRetained',
      'status',
      'notes',
      'year',
      'month',
    ] as const) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date as string) : null;
    return this.prisma.talentIncomeDistribution.update({ where: { id: distId }, data: updateData as never });
  }
  async removeDistribution(distId: string, workspaceId: string) {
    const dist = await this.prisma.talentIncomeDistribution.findFirst({
      where: { id: distId, contract: { talentProfile: { workspaceId, deletedAt: null } } },
    });
    if (!dist) throw new NotFoundException('Distribution not found');
    return this.prisma.talentIncomeDistribution.delete({ where: { id: distId } });
  }
}

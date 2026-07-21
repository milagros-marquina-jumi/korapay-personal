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
  async create(data: { workspaceId: string; name: string; email?: string; phone?: string }) {
    return this.prisma.talentProfile.create({ data });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    return this.prisma.talentProfile.update({
      where: { id },
      data: data as any,
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
      companyId?: string;
      clientId?: string;
      position?: string;
      rate?: string;
      currency?: string;
      startDate: string;
      endDate?: string;
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
        companyId: data.companyId,
        clientId: data.clientId,
        position: data.position,
        rate: data.rate,
        currency: data.currency ?? 'PEN',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        notes: data.notes,
      },
    });
  }
  async addDistribution(
    contractId: string,
    workspaceId: string,
    data: {
      transactionId?: string;
      amountWithDiscount: string;
      amountReceived: string;
      amountRetained: string;
      notes?: string;
    },
  ) {
    const contract = await this.prisma.talentContract.findFirst({
      where: { id: contractId, talentProfile: { workspaceId, deletedAt: null } },
    });
    if (!contract) throw new NotFoundException('Talent contract not found');
    return this.prisma.talentIncomeDistribution.create({
      data: {
        contractId,
        transactionId: data.transactionId,
        amountWithDiscount: data.amountWithDiscount,
        amountReceived: data.amountReceived,
        amountRetained: data.amountRetained,
        notes: data.notes,
        status: 'CONFIRMED',
      },
    });
  }
}

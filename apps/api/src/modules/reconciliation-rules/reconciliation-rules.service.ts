import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class ReconciliationRulesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(profileId: string) {
    return this.prisma.reconciliationRule.findMany({
      where: { profileId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(profileId: string, data: Record<string, unknown>) {
    return this.prisma.reconciliationRule.create({ data: { ...data, profileId } as never });
  }

  async update(id: string, profileId: string, data: Record<string, unknown>) {
    const found = await this.prisma.reconciliationRule.findFirst({ where: { id, profileId } });
    if (!found) throw new NotFoundException('Regla no encontrada');
    return this.prisma.reconciliationRule.update({ where: { id }, data: data as never });
  }

  async remove(id: string, profileId: string) {
    const found = await this.prisma.reconciliationRule.findFirst({ where: { id, profileId } });
    if (!found) throw new NotFoundException('Regla no encontrada');
    await this.prisma.reconciliationRule.delete({ where: { id } });
    return { ok: true };
  }

  async toggle(id: string, profileId: string) {
    const found = await this.prisma.reconciliationRule.findFirst({ where: { id, profileId } });
    if (!found) throw new NotFoundException('Regla no encontrada');
    return this.prisma.reconciliationRule.update({ where: { id }, data: { active: !found.active } });
  }
}

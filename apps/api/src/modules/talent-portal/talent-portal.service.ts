import { LEDGER_ACTOR_PREFIX, WorkspaceRole } from '@korapay/domain';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { type LedgerActor, type LedgerFilters, TalentLedgerService } from '../talent-ledger/talent-ledger.service';

@Injectable()
export class TalentPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: TalentLedgerService,
  ) {}

  private async resolve(token: string) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { accessToken: token, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Enlace no válido o revocado');
    return talent;
  }

  private actor(talentId: string, ownerProfileId: string): LedgerActor {
    return { profileId: ownerProfileId, label: `${LEDGER_ACTOR_PREFIX}${talentId}` };
  }

  private async ownerProfileId(workspaceId: string): Promise<string> {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, role: WorkspaceRole.OWNER },
    });
    if (!member) throw new NotFoundException('Workspace sin propietario');
    return member.profileId;
  }

  async profile(token: string) {
    const talent = await this.resolve(token);
    const summary = await this.ledger.talentSummary(talent.id);
    const debtRows = await this.ledger.debtDetail(talent.id);
    const ownerId = await this.ownerProfileId(talent.workspaceId);
    const owner = await this.prisma.profile.findUnique({ where: { id: ownerId }, select: { name: true } });
    return {
      talent: { id: talent.id, name: talent.name, status: talent.status },
      owner: { name: owner?.name ?? 'la empresa' },
      scope: talent.portalScope,
      summary,
      debtRows,
    };
  }

  private puedeEgresos(talent: { portalScope: string }) {
    return talent.portalScope === 'DEBTS_EXPENSES';
  }

  private sanear<T extends { type?: string; paidAmount?: string }>(talent: { portalScope: string }, data: T) {
    if (this.puedeEgresos(talent) && data.type === 'EGRESO') {
      return { ...data, type: 'EGRESO', debtAmount: '0', pendingAmount: '0' };
    }
    return { ...data, type: 'DEUDA', paidAmount: '0' };
  }

  async ledgerList(token: string, filters: Omit<LedgerFilters, 'talentId'>) {
    const talent = await this.resolve(token);
    const efectivos = this.puedeEgresos(talent) ? filters : { ...filters, type: 'DEUDA' };
    return this.ledger.listByTalent(talent.id, efectivos);
  }

  async create(token: string, data: Parameters<TalentLedgerService['create']>[2]) {
    const talent = await this.resolve(token);
    const ownerId = await this.ownerProfileId(talent.workspaceId);
    return this.ledger.create(
      talent.workspaceId,
      talent.id,
      this.sanear(talent, data),
      'TALENT',
      this.actor(talent.id, ownerId),
    );
  }

  async update(token: string, id: string, data: Parameters<TalentLedgerService['update']>[2]) {
    const talent = await this.resolve(token);
    const ownerId = await this.ownerProfileId(talent.workspaceId);
    return this.ledger.update(
      id,
      talent.workspaceId,
      this.sanear(talent, data),
      this.actor(talent.id, ownerId),
      talent.id,
    );
  }
}

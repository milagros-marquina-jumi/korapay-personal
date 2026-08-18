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
      summary,
      debtRows,
    };
  }

  async ledgerList(token: string, filters: Omit<LedgerFilters, 'talentId'>) {
    const talent = await this.resolve(token);
    return this.ledger.listByTalent(talent.id, filters);
  }

  async create(token: string, data: Parameters<TalentLedgerService['create']>[2]) {
    const talent = await this.resolve(token);
    const ownerId = await this.ownerProfileId(talent.workspaceId);
    const soloDeuda = { ...data, type: 'DEUDA', paidAmount: '0' };
    return this.ledger.create(talent.workspaceId, talent.id, soloDeuda, 'TALENT', this.actor(talent.id, ownerId));
  }

  async update(token: string, id: string, data: Parameters<TalentLedgerService['update']>[2]) {
    const talent = await this.resolve(token);
    const ownerId = await this.ownerProfileId(talent.workspaceId);
    const soloDeuda = { ...data, type: 'DEUDA', paidAmount: '0' };
    return this.ledger.update(id, talent.workspaceId, soloDeuda, this.actor(talent.id, ownerId), talent.id);
  }
}

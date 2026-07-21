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
    if (!talent) throw new NotFoundException('Enlace no valido o revocado');
    return talent;
  }

  private actor(talentId: string, ownerProfileId: string): LedgerActor {
    return { profileId: ownerProfileId, label: `TALENT:${talentId}` };
  }

  private async ownerProfileId(workspaceId: string): Promise<string> {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, role: 'OWNER' },
    });
    if (!member) throw new NotFoundException('Workspace sin propietario');
    return member.profileId;
  }

  async profile(token: string) {
    const talent = await this.resolve(token);
    const summary = await this.ledger.talentSummary(talent.id);
    return {
      talent: { id: talent.id, name: talent.name, status: talent.status },
      summary,
    };
  }

  async ledgerList(token: string, filters: Omit<LedgerFilters, 'talentId'>) {
    const talent = await this.resolve(token);
    return this.ledger.listByTalent(talent.id, filters);
  }

  async create(token: string, data: Parameters<TalentLedgerService['create']>[2]) {
    const talent = await this.resolve(token);
    const ownerId = await this.ownerProfileId(talent.workspaceId);
    return this.ledger.create(talent.workspaceId, talent.id, data, 'TALENT', this.actor(talent.id, ownerId));
  }

  async update(token: string, id: string, data: Parameters<TalentLedgerService['update']>[2]) {
    const talent = await this.resolve(token);
    const ownerId = await this.ownerProfileId(talent.workspaceId);
    return this.ledger.update(id, talent.workspaceId, data, this.actor(talent.id, ownerId), talent.id);
  }
}

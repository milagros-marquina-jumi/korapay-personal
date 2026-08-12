import { EmailProvider } from '@korapay/domain';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { UpdateEmailSourceDto } from './email-sources.dto';
import { generateIngestionToken } from './ingestion-token';

function serialize(source: {
  id: string;
  name: string;
  email: string;
  provider: string;
  status: string;
  defaultWorkspaceId: string | null;
  defaultAccountId: string | null;
  tokenPrefix: string;
  lastReceivedAt: Date | null;
  lastSuccessfulIngestionAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: source.id,
    name: source.name,
    email: source.email,
    provider: source.provider,
    status: source.status,
    defaultWorkspaceId: source.defaultWorkspaceId,
    defaultAccountId: source.defaultAccountId,
    tokenPrefix: source.tokenPrefix,
    lastReceivedAt: source.lastReceivedAt,
    lastSuccessfulIngestionAt: source.lastSuccessfulIngestionAt,
    createdAt: source.createdAt,
    revokedAt: source.revokedAt,
  };
}

@Injectable()
export class EmailSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(profileId: string) {
    const sources = await this.prisma.emailSource.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
    });
    const counts = await this.prisma.detectedBankTransaction.groupBy({
      by: ['emailSourceId', 'status'],
      where: { profileId },
      _count: { _all: true },
    });
    return sources.map((s) => ({
      ...serialize(s),
      pendingCount: counts
        .filter((c) => c.emailSourceId === s.id && c.status === 'PENDING_REVIEW')
        .reduce((sum, c) => sum + c._count._all, 0),
    }));
  }

  async findOne(id: string, profileId: string) {
    const source = await this.prisma.emailSource.findFirst({ where: { id, profileId } });
    if (!source) throw new NotFoundException('Fuente de correo no encontrada');
    return serialize(source);
  }

  async create(
    profileId: string,
    data: { name: string; email: string; defaultWorkspaceId?: string; defaultAccountId?: string },
  ) {
    const existing = await this.prisma.emailSource.findFirst({
      where: {
        profileId,
        provider: EmailProvider.GMAIL_APPS_SCRIPT,
        email: { equals: data.email, mode: 'insensitive' },
      },
    });
    if (existing) throw new ConflictException('Ese correo ya está conectado');
    const { token, hash, prefix } = generateIngestionToken();
    const source = await this.prisma.emailSource.create({
      data: {
        profileId,
        name: data.name,
        email: data.email,
        provider: EmailProvider.GMAIL_APPS_SCRIPT,
        defaultWorkspaceId: data.defaultWorkspaceId ?? null,
        defaultAccountId: data.defaultAccountId ?? null,
        tokenHash: hash,
        tokenPrefix: prefix,
      },
    });
    return { source: serialize(source), ingestionToken: token };
  }

  async update(id: string, profileId: string, data: UpdateEmailSourceDto) {
    await this.findOne(id, profileId);
    const updated = await this.prisma.emailSource.update({ where: { id }, data });
    return serialize(updated);
  }

  async regenerateToken(id: string, profileId: string) {
    await this.findOne(id, profileId);
    const { token, hash, prefix } = generateIngestionToken();
    const updated = await this.prisma.emailSource.update({
      where: { id },
      data: { tokenHash: hash, tokenPrefix: prefix, status: 'ACTIVE', revokedAt: null },
    });
    return { source: serialize(updated), ingestionToken: token };
  }

  async setStatus(id: string, profileId: string, status: 'ACTIVE' | 'PAUSED' | 'REVOKED') {
    await this.findOne(id, profileId);
    const updated = await this.prisma.emailSource.update({
      where: { id },
      data: { status, revokedAt: status === 'REVOKED' ? new Date() : null },
    });
    return serialize(updated);
  }

  async remove(id: string, profileId: string) {
    await this.findOne(id, profileId);
    await this.prisma.emailSource.delete({ where: { id } });
    return { ok: true };
  }
}

import { Injectable } from '@nestjs/common';
import type { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  async log(params: {
    workspaceId?: string;
    profileId: string;
    action: string;
    entity: string;
    entityId: string;
    changes?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: { ...params, changes: params.changes as any },
    });
  }
  async findAll(workspaceId: string, page = 1, pageSize = 50) {
    const where = { workspaceId };
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { profile: { select: { name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

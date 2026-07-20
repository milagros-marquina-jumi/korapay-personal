import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.params.workspaceId ?? request.query.workspaceId;
    const userId = request.user?.sub;
    if (!workspaceId) return true;
    if (!userId) throw new ForbiddenException('User not authenticated');
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_profileId: {
          workspaceId,
          profileId: userId,
        },
      },
    });
    if (!member) throw new ForbiddenException('No access to this workspace');
    request.workspaceRole = member.role;
    request.workspaceId = workspaceId;
    return true;
  }
}

import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.params?.workspaceId ?? request.query?.workspaceId ?? request.body?.workspaceId;
    const userId = request.user?.sub;

    if (!userId) throw new UnauthorizedException('Usuario no autenticado');
    if (!workspaceId) {
      throw new BadRequestException('Falta workspaceId');
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_profileId: { workspaceId, profileId: userId } },
    });
    if (!member) throw new ForbiddenException('Sin acceso a este workspace');

    request.workspaceRole = member.role;
    request.workspaceId = workspaceId;
    return true;
  }
}

import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private cachedProfileId: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const demoDisabled = this.configService.get<string>('DEMO_MODE') === 'false';

    if (demoDisabled) {
      throw new UnauthorizedException('Autenticacion no configurada. Usa DEMO_MODE=true.');
    }

    request.user = await this.resolveUser();
    return true;
  }

  private async resolveUser(): Promise<AuthUser> {
    const email = this.configService.get<string>('DEMO_USER_EMAIL');
    let current = this.cachedProfileId
      ? await this.prisma.profile.findUnique({ where: { id: this.cachedProfileId } })
      : null;
    if (!current) {
      current = await this.prisma.profile.findUnique({ where: { email } });
      if (!current) {
        this.cachedProfileId = null;
        throw new UnauthorizedException('Perfil no encontrado. Corre el seed: pnpm db:seed');
      }
      this.cachedProfileId = current.id;
    }
    return { sub: current.id, email: current.email, name: current.name };
  }
}

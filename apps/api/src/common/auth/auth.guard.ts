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
    const email = this.configService.get<string>('DEMO_USER_EMAIL', 'demo@korapay.local');
    if (!this.cachedProfileId) {
      const profile = await this.prisma.profile.findUnique({ where: { email } });
      if (!profile) {
        throw new UnauthorizedException('Perfil no encontrado. Corre el seed: pnpm db:seed');
      }
      this.cachedProfileId = profile.id;
    }
    return { sub: this.cachedProfileId, email, name: 'Milagros Marquina' };
  }
}

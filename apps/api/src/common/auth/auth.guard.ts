import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AuthGuard implements CanActivate {
  private cachedDemoProfileId: string | null = null;
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const demoMode = this.configService.get<string>('DEMO_MODE') === 'true';
    if (demoMode) {
      if (!this.cachedDemoProfileId) {
        const demoEmail = this.configService.get<string>('DEMO_USER_EMAIL', 'demo@korapay.local');
        const profile = await this.prisma.profile.findUnique({
          where: { email: demoEmail },
        });
        this.cachedDemoProfileId = profile?.id ?? 'demo-user-id';
      }
      request.user = {
        sub: this.cachedDemoProfileId,
        email: this.configService.get<string>('DEMO_USER_EMAIL', 'demo@korapay.local'),
        name: 'Demo User',
      };
      return true;
    }
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new Error('Invalid authorization format');
    }
    request.user = { sub: 'authenticated-user', token };
    return true;
  }
}

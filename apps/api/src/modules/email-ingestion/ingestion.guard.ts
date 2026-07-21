import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { hashIngestionToken } from '../email-sources/ingestion-token';

@Injectable()
export class IngestionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Token de ingesta requerido');

    const source = await this.prisma.emailSource.findFirst({ where: { tokenHash: hashIngestionToken(token) } });
    if (!source) throw new UnauthorizedException('Token de ingesta inválido');
    if (source.status !== 'ACTIVE') throw new UnauthorizedException('Fuente de correo pausada o revocada');

    request.emailSource = source;
    return true;
  }

  private extractToken(request: { headers: Record<string, string | string[] | undefined> }): string | null {
    const auth = request.headers.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7).trim();
    const header = request.headers['x-korapay-ingestion-token'];
    if (typeof header === 'string') return header.trim();
    return null;
  }
}

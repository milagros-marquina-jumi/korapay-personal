import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      currency: profile.currency,
      theme: profile.theme,
    };
  }

  async update(id: string, data: { name?: string; email?: string }) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    if (data.email && data.email !== profile.email) {
      const taken = await this.prisma.profile.findUnique({ where: { email: data.email } });
      if (taken) throw new ConflictException('Ese correo ya está en uso');
    }
    const updated = await this.prisma.profile.update({
      where: { id },
      data: { name: data.name, email: data.email },
    });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      currency: updated.currency,
      theme: updated.theme,
    };
  }
}

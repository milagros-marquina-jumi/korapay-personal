import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMOJI_TO_ICON: Record<string, string> = {
  '🏠': 'Home',
  '💰': 'Wallet',
  '💼': 'Briefcase',
  '🏢': 'Building2',
  '🐷': 'PiggyBank',
  '👥': 'Users',
  '⭐': 'Star',
  '🚀': 'Rocket',
  '🤝': 'Users',
};

async function main() {
  const workspaces = await prisma.workspace.findMany({ where: { deletedAt: null } });

  for (const ws of workspaces) {
    const icon = EMOJI_TO_ICON[ws.emoji] ?? 'Home';
    console.log(`${ws.name}: ${ws.emoji} → ${icon}`);
    await prisma.workspace.update({
      where: { id: ws.id },
      data: { emoji: icon },
    });
  }

  console.log(`\n${workspaces.length} workspaces actualizados.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Sidebar />
      <div className="flex flex-1 flex-col lg:ml-64">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function Sidebar() {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/movimientos', label: 'Movimientos', icon: '💸' },
    { href: '/cuentas', label: 'Cuentas', icon: '🏦' },
    { href: '/pendientes', label: 'Pendientes', icon: '⏰' },
    { href: '/deudas', label: 'Deudas', icon: '📋' },
    { href: '/ahorros', label: 'Ahorros', icon: '🐷' },
    { href: '/mimotech', label: 'MIMOTECH', icon: '🚀' },
    { href: '/mimotalents', label: 'Mimotalents', icon: '🎯' },
    { href: '/reportes', label: 'Reportes', icon: '📈' },
  ];

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          K
        </div>
        <span className="font-display text-lg font-bold">KoraPay</span>
      </div>

      <div className="border-b px-4 py-3">
        <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" defaultValue="personal">
          <option value="personal">Personal</option>
          <option value="mimotech">MIMOTECH</option>
          <option value="mimotalents">Mimotalents</option>
        </select>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'text-muted-foreground',
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="border-t p-4">
        <a
          href="/configuracion"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          <span>⚙️</span>
          Configuracion
        </a>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/85 px-4 backdrop-blur-xl md:px-6">
      <button type="button" className="rounded-lg p-2 hover:bg-accent lg:hidden" aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Demo User</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
          DU
        </div>
      </div>
    </header>
  );
}

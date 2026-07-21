import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Rocket,
  Settings,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/cuentas', label: 'Cuentas', icon: Wallet },
  { href: '/pendientes', label: 'Pendientes', icon: Receipt },
  { href: '/deudas', label: 'Deudas', icon: TrendingUp },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/mimotech', label: 'MIMOTECH', icon: Rocket },
  { href: '/mimotalents', label: 'Mimotalents', icon: Target },
  { href: '/reportes', label: 'Reportes', icon: Users },
];

export const footerNavItem: NavItem = { href: '/configuracion', label: 'Configuracion', icon: Settings };

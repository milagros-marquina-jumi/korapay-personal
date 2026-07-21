import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Banknote,
  Boxes,
  Building2,
  FileText,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Rocket,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
}

const PERSONAL: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/cuentas', label: 'Cuentas', icon: Wallet },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/deudas', label: 'Deudas', icon: TrendingUp },
  { href: '/pendientes', label: 'Pendientes', icon: Receipt },
];

const EMPLOYMENT: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ingresos', label: 'Ingresos', icon: ArrowLeftRight },
  { href: '/empresas', label: 'Empresas', icon: Building2 },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/renta', label: 'Renta anual', icon: Banknote },
];

const BUSINESS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/mimotech/costos',
    label: 'Movimientos',
    icon: ArrowLeftRight,
    children: [
      { href: '/mimotech/costos', label: 'Costos', icon: Boxes },
      { href: '/mimotech/equipo', label: 'Pagos equipo', icon: Users },
      { href: '/mimotech/talentos', label: 'Talentos', icon: Rocket },
    ],
  },
  { href: '/proyectos', label: 'Proyectos', icon: Boxes },
  { href: '/aplicaciones', label: 'Aplicaciones', icon: Rocket },
  { href: '/reportes', label: 'Reportes', icon: TrendingUp },
];

const SHARED: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/cuentas', label: 'Cuentas', icon: Wallet },
  { href: '/empresas', label: 'Empresas', icon: Building2 },
  { href: '/reportes', label: 'Reportes', icon: TrendingUp },
];

export const navByWorkspaceType: Record<string, NavItem[]> = {
  PERSONAL,
  EMPLOYMENT,
  BUSINESS,
  SHARED,
};

export function navForType(type: string | undefined): NavItem[] {
  return navByWorkspaceType[type ?? 'PERSONAL'] ?? PERSONAL;
}

export const footerNavItem: NavItem = { href: '/configuracion', label: 'Configuración', icon: Settings };

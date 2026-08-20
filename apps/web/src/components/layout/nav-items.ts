import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  MailCheck,
  PiggyBank,
  Receipt,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
  UsersRound,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
  linkable?: boolean;
}

const PERSONAL: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/movimientos',
    label: 'Movimientos',
    icon: ArrowLeftRight,
    linkable: true,
    children: [{ href: '/movimientos/detectados', label: 'Detectados', icon: MailCheck }],
  },
  { href: '/ahorros', label: 'Ahorros', icon: PiggyBank },
  { href: '/deudas', label: 'Deudas', icon: TrendingUp },
  { href: '/pendientes', label: 'Pendientes', icon: Receipt },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
];

const EMPLOYMENT: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ingresos', label: 'Ingresos', icon: ArrowLeftRight },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/renta', label: 'Renta anual', icon: Banknote },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
];

const BUSINESS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/mimotech/equipo',
    label: 'MIMOTECH',
    icon: Building2,
    children: [
      { href: '/mimotech/equipo', label: 'Colaboradores', icon: Users },
      { href: '/mimotech/equipo/pagos', label: 'Pagos al equipo', icon: Banknote },
      { href: '/mimotech/costos', label: 'Costos', icon: Receipt },
      { href: '/reportes', label: 'Reporte de operación', icon: TrendingUp },
      { href: '/mimotech/equipo/reporte', label: 'Reporte de equipo', icon: BarChart3 },
    ],
  },
  {
    href: '/mimotech/talentos',
    label: 'MIMOTALENTS',
    icon: UsersRound,
    children: [
      { href: '/mimotech/talentos', label: 'Talentos', icon: Users },
      { href: '/mimotech/talentos/reporte', label: 'Reporte de talentos', icon: BarChart3 },
    ],
  },
];

const SHARED: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
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

export const footerNavItems: NavItem[] = [
  { href: '/perfil', label: 'Mi perfil', icon: UserCircle },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Boxes,
  Building2,
  CalendarRange,
  FileText,
  LayoutDashboard,
  MailCheck,
  PiggyBank,
  Receipt,
  Rocket,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
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
  {
    href: '/ingresos',
    label: 'Ingresos',
    icon: ArrowLeftRight,
    linkable: true,
    children: [{ href: '/ingresos/resumen-mes', label: 'Resumen por mes', icon: CalendarRange }],
  },
  { href: '/contratos', label: 'Contratos', icon: FileText },
  { href: '/renta', label: 'Renta anual', icon: Banknote },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
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
      {
        href: '/mimotech/talentos',
        label: 'Talentos',
        icon: Rocket,
        linkable: true,
        children: [{ href: '/mimotech/talentos/reporte', label: 'Reporte general', icon: BarChart3 }],
      },
    ],
  },
  { href: '/proyectos', label: 'Proyectos', icon: Boxes },
  { href: '/aplicaciones', label: 'Aplicaciones', icon: Rocket },
  { href: '/reportes', label: 'Reportes', icon: TrendingUp },
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

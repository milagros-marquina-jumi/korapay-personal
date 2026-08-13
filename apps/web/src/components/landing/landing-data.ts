import {
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  Landmark,
  MailCheck,
  PiggyBank,
  Receipt,
  Smartphone,
  Users,
  Wallet,
  WifiOff,
} from 'lucide-react';

export const HERO = {
  badge: 'Hecho para quien factura por su cuenta',
  titulo: ['Cobras de varios sitios.', 'Tus cuentas', 'deberían saberlo.'],
  subtitulo:
    'Sueldo, proyectos, cliente propio y renta anual no caben en la misma hoja de Excel. KoraPay los separa en workspaces y te dice qué debes, qué te deben y cuándo.',
  ctaPrincipal: { label: 'Entrar a mi cuenta', href: '/dashboard' },
  ctaSecundario: { label: 'Ver qué hace', href: '#funcionalidades' },
} as const;

export const WORKSPACES = [
  {
    icon: Wallet,
    nombre: 'Personal',
    descripcion: 'Movimientos del día a día, ahorros por metas, deudas y pendientes por cobrar.',
    puntos: ['Ingresos y egresos', 'Metas de ahorro', 'Deudas con cuotas'],
  },
  {
    icon: Building2,
    nombre: 'Ingresos laborales',
    descripcion: 'Empresas donde trabajas, contratos con fechas reales y renta anual con sus cuotas.',
    puntos: ['Contratos por empresa', 'Duración real trabajada', 'Renta anual y cuotas'],
  },
  {
    icon: Users,
    nombre: 'Negocio',
    descripcion: 'Costos de infraestructura, pagos al equipo y talentos colocados en clientes.',
    puntos: ['Costos y suscripciones', 'Pagos al equipo', 'Talentos y colocaciones'],
  },
  {
    icon: Landmark,
    nombre: 'Compartido',
    descripcion: 'Finanzas de sociedades con reparto claro entre socios.',
    puntos: ['Movimientos compartidos', 'Empresas y clientes', 'Reportes conjuntos'],
  },
] as const;

export const FEATURES = [
  {
    icon: CalendarDays,
    titulo: 'Calendario financiero',
    descripcion:
      'Vencimientos, cobros y fin de contratos de todos tus workspaces en una sola vista. Con aviso de lo vencido.',
  },
  {
    icon: BarChart3,
    titulo: 'Reportes que responden',
    descripcion: 'Evolución por mes, duración real por empresa, rentabilidad y trimestres. Sin armar tablas dinámicas.',
  },
  {
    icon: MailCheck,
    titulo: 'Detección desde correo',
    descripcion: 'Lee los correos de tu banco y propone el movimiento ya clasificado. Tú solo confirmas.',
  },
  {
    icon: FileText,
    titulo: 'Contratos con fechas',
    descripcion: 'Inicio, fin y reingresos. La duración se calcula sola y no suma periodos que se solapan.',
  },
  {
    icon: Banknote,
    titulo: 'Renta anual',
    descripcion: 'Devengado y caja: lo que generó cada año y lo que realmente pagas al siguiente, con sus cuotas.',
  },
  {
    icon: Receipt,
    titulo: 'Multi-moneda',
    descripcion: 'Soles y dólares con tipo de cambio del día. Cada movimiento guarda su monto original.',
  },
] as const;

export const PWA = [
  { icon: Smartphone, titulo: 'Instalable', texto: 'Se instala como app en el móvil o el escritorio.' },
  { icon: WifiOff, titulo: 'Funciona sin conexión', texto: 'Lo que ya viste sigue disponible aunque se caiga la red.' },
  {
    icon: ArrowLeftRight,
    titulo: 'Siempre al día',
    texto: 'Avisa cuando hay una versión nueva, sin recargar a ciegas.',
  },
] as const;

export const REPORTES = [
  'Ingresos por mes y por año',
  'Duración real en cada empresa',
  'Rentabilidad por cliente',
  'Trimestres y estacionalidad',
  'Egresos por categoría',
  'Renta devengada vs caja',
] as const;

export const FOOTER_LINKS = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Workspaces', href: '#workspaces' },
  { label: 'Reportes', href: '#reportes' },
  { label: 'Entrar', href: '/dashboard' },
] as const;

export const AHORRO_ICON = PiggyBank;

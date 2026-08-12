import { WorkspaceType } from '@korapay/domain';

export interface WorkspaceTypeOption {
  value: string;
  label: string;
  hint: string;
}

export const WORKSPACE_TYPE_OPTIONS: WorkspaceTypeOption[] = [
  { value: WorkspaceType.PERSONAL, label: 'Personal', hint: 'Finanzas personales del día a día' },
  { value: WorkspaceType.EMPLOYMENT, label: 'Ingresos laborales', hint: 'Empresas donde trabajas (planilla/recibos)' },
  { value: WorkspaceType.BUSINESS, label: 'Empresa', hint: 'Tu empresa: costos, equipo, proyectos' },
  { value: WorkspaceType.SHARED, label: 'Compartido', hint: 'Sociedad o gastos compartidos' },
  { value: WorkspaceType.SAVINGS, label: 'Ahorros', hint: 'Metas y fondos de ahorro' },
  { value: WorkspaceType.DEBTS, label: 'Deudas', hint: 'Préstamos y obligaciones' },
  { value: WorkspaceType.PROJECT, label: 'Proyecto', hint: 'Presupuesto y gastos de un proyecto' },
  { value: WorkspaceType.TRAVEL, label: 'Viaje', hint: 'Gastos de un viaje concreto' },
  { value: WorkspaceType.HOUSEHOLD, label: 'Hogar', hint: 'Gastos compartidos del hogar' },
  { value: WorkspaceType.TALENT_MANAGEMENT, label: 'Gestión de talentos', hint: 'Talentos tercerizados y sus pagos' },
];

const LABELS = new Map(WORKSPACE_TYPE_OPTIONS.map((o) => [o.value, o.label]));

export function workspaceTypeLabel(type: string) {
  return LABELS.get(type) ?? type;
}

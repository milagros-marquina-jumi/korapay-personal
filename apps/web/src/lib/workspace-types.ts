export interface WorkspaceTypeOption {
  value: string;
  label: string;
  hint: string;
}

export const WORKSPACE_TYPE_OPTIONS: WorkspaceTypeOption[] = [
  { value: 'PERSONAL', label: 'Personal', hint: 'Finanzas personales del día a día' },
  { value: 'EMPLOYMENT', label: 'Ingresos laborales', hint: 'Empresas donde trabajas (planilla/recibos)' },
  { value: 'BUSINESS', label: 'Empresa', hint: 'Tu empresa: costos, equipo, proyectos' },
  { value: 'SHARED', label: 'Compartido', hint: 'Sociedad o gastos compartidos' },
  { value: 'SAVINGS', label: 'Ahorros', hint: 'Metas y fondos de ahorro' },
  { value: 'DEBTS', label: 'Deudas', hint: 'Préstamos y obligaciones' },
];

const LABELS = new Map(WORKSPACE_TYPE_OPTIONS.map((o) => [o.value, o.label]));

export function workspaceTypeLabel(type: string) {
  return LABELS.get(type) ?? type;
}

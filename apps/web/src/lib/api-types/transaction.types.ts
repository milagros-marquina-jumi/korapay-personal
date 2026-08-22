export interface Transaction {
  id: string;
  type: string;
  concept: string;
  sourceRef?: string | null;
  description?: string | null;
  date: string;
  amountOriginal: string;
  amountGross?: string | null;
  currency: string;
  amountBase: string;
  exchangeRate?: string | null;
  status: string;
  categoryId?: string | null;
  accountId?: string | null;
  companyId?: string | null;
  contractId?: string | null;
  personId?: string | null;
  projectId?: string | null;
  applicationId?: string | null;
  notes?: string | null;
  dueDate?: string | null;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule | null;
  tags: string[];
  account?: { name: string } | null;
  category?: { name: string } | null;
  application?: { id: string; name: string } | null;
  projects?: { id: string; name: string }[];
  person?: { id: string; name: string; role?: string | null } | null;
}

export interface RecurrenceRule {
  id: string;
  frequency: string;
  interval: number;
  type?: string | null;
  concept?: string | null;
  amount?: string | null;
  currency?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  paymentMethod?: string | null;
  bank?: string | null;
  notes?: string | null;
  isFixedExpense: boolean;
  status: string;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  generatedCount: number;
  endDate?: string | null;
  endAfterCount?: number | null;
  _count?: { transactions: number };
}

export interface Debt {
  id: string;
  direction: string;
  concept: string;
  originalAmount: string;
  currency: string;
  dueDate?: string | null;
  interestRate?: string | null;
  notes?: string | null;
  status: string;
  totalPaid?: string;
  balance?: string;
  payments?: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  amount: string;
  date: string;
  method?: string | null;
  notes?: string | null;
}

export interface PendingItem {
  id: string;
  kind: string;
  concept: string;
  amount: string;
  currency: string;
  issuedDate?: string | null;
  dueDate: string;
  status: string;
  personId?: string | null;
  notes?: string | null;
}

export interface DashboardSummary {
  patrimonio: string;
  ingresos: string;
  egresos: string;
  disponible: string;
  ahorro: string;
  porCobrar: string;
  porPagar: string;
  vencido: string;
  costosMimotech: string;
  pagosEquipo: string;
  ingresoRealMimotech: string;
  utilidadMimotech: string;
  saldoMimotalents: string;
  debtTotal: string;
  debtPaid: string;
}

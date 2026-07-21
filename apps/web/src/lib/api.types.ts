export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface Workspace {
  id: string;
  name: string;
  type: string;
  emoji: string;
  color?: string | null;
  currency: string;
  status: string;
}

export interface Account {
  id: string;
  name: string;
  bank: string;
  kind: string;
  currency: string;
  lastFour?: string | null;
  initialBalance: string;
  color?: string | null;
  emoji?: string | null;
  status: string;
  calculatedBalance?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  parentId?: string | null;
}

export interface Company {
  id: string;
  name: string;
  ruc?: string | null;
  industry?: string | null;
}

export interface Person {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  initials?: string | null;
  role?: string | null;
}

export interface Transaction {
  id: string;
  type: string;
  concept: string;
  description?: string | null;
  date: string;
  amountOriginal: string;
  currency: string;
  amountBase: string;
  status: string;
  categoryId?: string | null;
  accountId?: string | null;
  companyId?: string | null;
  personId?: string | null;
  projectId?: string | null;
  applicationId?: string | null;
  notes?: string | null;
  tags: string[];
  account?: { name: string } | null;
  category?: { name: string } | null;
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
  utilidadMimotech: string;
  saldoMimotalents: string;
  debtTotal: string;
  debtPaid: string;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: string;
  currency: string;
  targetDate?: string | null;
  monthlyRecommend?: string | null;
  status: string;
  currentAmount?: string;
  progress?: number;
  entries?: SavingEntry[];
}

export interface SavingEntry {
  id: string;
  amount: string;
  type: string;
  date: string;
  notes?: string | null;
}

export interface Debt {
  id: string;
  direction: string;
  concept: string;
  originalAmount: string;
  currency: string;
  dueDate?: string | null;
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
  dueDate: string;
  status: string;
  personId?: string | null;
  notes?: string | null;
}

export interface TalentContract {
  id: string;
  position?: string | null;
  rate?: string | null;
  currency: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  notes?: string | null;
  incomeDistributions?: TalentIncomeDistribution[];
}

export interface TalentIncomeDistribution {
  id: string;
  amountWithDiscount: string;
  amountReceived: string;
  amountRetained: string;
  status: string;
  notes?: string | null;
}

export interface Talent {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  notes?: string | null;
  contracts?: TalentContract[];
}

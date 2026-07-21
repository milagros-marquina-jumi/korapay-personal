export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  currency: string;
  theme: string;
}

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
  description?: string | null;
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
  accessToken?: string | null;
  tokenEnabledAt?: string | null;
  contracts?: TalentContract[];
}

export interface TalentLedgerEntry {
  id: string;
  talentId: string;
  date: string;
  year: number;
  month: number;
  type: string;
  paidAmount: string;
  debtAmount: string;
  pendingAmount: string;
  currency: string;
  status: string;
  description?: string | null;
  source: string;
}

export interface TalentLedgerSummary {
  talentId: string;
  name: string;
  status: string;
  totalPaid: string;
  totalDebt: string;
  totalPending: string;
  balance: string;
}

export interface TalentSummaryTotals {
  totalPaid: string;
  totalDebt: string;
  totalPending: string;
  balance: string;
}

export interface TalentAuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  changes: {
    actor?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  } | null;
  createdAt: string;
}

export interface TalentPortalProfile {
  talent: { id: string; name: string; status: string };
  summary: TalentSummaryTotals;
}

export interface CurrencyCatalog {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

export interface PaymentMethodCatalog {
  id: string;
  name: string;
}

export interface BankCatalog {
  id: string;
  name: string;
  country: string;
}

export interface ExchangeRateInfo {
  from: string;
  to: string;
  rate: string;
  date: string;
}

export interface EmploymentContract {
  id: string;
  companyId?: string | null;
  position?: string | null;
  type?: string | null;
  startDate: string;
  endDate?: string | null;
  salary?: string | null;
  currency: string;
  status: string;
}

export interface TaxObligation {
  id: string;
  name: string;
  dueDate: string;
  amount: string;
  status: string;
  notes?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  emoji?: string | null;
}

export interface Application {
  id: string;
  name: string;
  provider?: string | null;
  category?: string | null;
  url?: string | null;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  currency: string;
  theme: string;
}

export interface EmailSource {
  id: string;
  name: string;
  email: string;
  provider: string;
  status: string;
  defaultWorkspaceId?: string | null;
  defaultAccountId?: string | null;
  tokenPrefix: string;
  lastReceivedAt?: string | null;
  lastSuccessfulIngestionAt?: string | null;
  createdAt: string;
  revokedAt?: string | null;
  pendingCount?: number;
}

export interface EmailSourceCreated {
  source: EmailSource;
  ingestionToken: string;
}

export interface DetectedTransaction {
  id: string;
  workspaceId?: string | null;
  emailSourceId: string;
  accountId?: string | null;
  categoryId?: string | null;
  projectId?: string | null;
  applicationId?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  cardLast4?: string | null;
  merchantOriginal?: string | null;
  merchantNormalized?: string | null;
  description: string;
  transactionType: string;
  amount: string;
  currency: string;
  occurredAt: string;
  externalReference?: string | null;
  installments?: number | null;
  confidence: number;
  status: string;
  transactionId?: string | null;
  rawDataSanitized?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DetectedSummary {
  pendingReview: number;
  highConfidence: number;
  withoutAccount: number;
  duplicates: number;
  failed: number;
}

export interface ReconciliationRule {
  id: string;
  workspaceId: string;
  name: string;
  emailSourceId?: string | null;
  senderPattern?: string | null;
  merchantPattern?: string | null;
  bankCode?: string | null;
  cardLast4?: string | null;
  targetWorkspaceId: string;
  targetAccountId?: string | null;
  targetCategoryId?: string | null;
  autoConfirm: boolean;
  priority: number;
  active: boolean;
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
  startDate?: string | null;
  endDate?: string | null;
  clientCount?: number;
}

export interface Client {
  id: string;
  companyId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface MonthlySummaryCompany {
  name: string;
  net: string;
  concept: string;
  status: string;
}

export interface MonthlySummaryPeriod {
  year: number;
  month: number;
  totalNet: string;
  companies: MonthlySummaryCompany[];
}

export interface MonthlySummary {
  data: MonthlySummaryPeriod[];
  years: number[];
}

export interface Person {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  initials?: string | null;
  role?: string | null;
  kind?: string;
  status?: string;
  salary?: string | null;
  notes?: string | null;
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
  exchangeRate?: string | null;
  status: string;
  categoryId?: string | null;
  accountId?: string | null;
  companyId?: string | null;
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
  endDate?: string | null;
  endAfterCount?: number | null;
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

export interface SavingBalanceAccount {
  bucket: string;
  bank?: string | null;
  currency: string;
  amount: string;
  amountBase: string;
}

export interface SavingBalancePeriod {
  year: number;
  month: number;
  label: string;
  total: string;
  accounts: SavingBalanceAccount[];
}

export interface SavingBalancesMonthly {
  data: SavingBalancePeriod[];
  years: number[];
}

export interface PersonalReports {
  years: number[];
  expenseByCategory: { name: string; total: string }[];
  incomeVsExpense: { year: number; month: number; label: string; income: string; expense: string; net: string }[];
  savingsEvolution: { year: number; month: number; label: string; total: string }[];
  fixedVsVariable: { fixed: string; variable: string };
}

export interface BusinessReports {
  years: number[];
  income: string;
  cost: string;
  teamPayment: string;
  utility: string;
  costByApp: { name: string; total: string }[];
  teamByPerson: { name: string; total: string }[];
  talent: { paid: string; debt: string; pending: string; balance: string };
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
  companyName?: string | null;
  clientName?: string | null;
  position?: string | null;
  paymentType?: string | null;
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
  date?: string | null;
  year?: number | null;
  month?: number | null;
  paymentType: string;
  salary?: string | null;
  amountWithDiscount: string;
  amountReceived: string;
  amountRetained: string;
  status: string;
  notes?: string | null;
}

export interface GlobalCompany {
  id: string;
  name: string;
  ruc?: string | null;
}

export interface GlobalClient {
  id: string;
  name: string;
}

export interface TalentDebtRow {
  id: string;
  date: string;
  description: string;
  debt: string;
  pending: string;
  status: string;
}

export interface TalentReport {
  income: { salary: string; withDiscount: string; receivedByMe: string; keptByTalent: string };
  expense: { paid: string; debt: string; pending: string };
  net: string;
  byMonth: {
    year: number;
    month: number;
    label: string;
    salary: string;
    withDiscount: string;
    income: string;
    kept: string;
    expense: string;
    debt: string;
    pending: string;
    net: string;
  }[];
  debtRows: TalentDebtRow[];
}

export interface TalentPivotPeriod {
  year: number;
  month: number;
  label: string;
  total: string;
  cells: { name: string; amount: string }[];
}

export interface TalentGlobalReport {
  years: number[];
  totals: {
    salary: string;
    withDiscount: string;
    received: string;
    kept: string;
    paid: string;
    debt: string;
    pending: string;
    net: string;
  };
  incomeByPerson: {
    talentId: string;
    name: string;
    salary: string;
    withDiscount: string;
    received: string;
    kept: string;
  }[];
  expenseByPerson: { talentId: string; name: string; paid: string; debt: string; pending: string }[];
  incomePivot: TalentPivotPeriod[];
  expensePivot: TalentPivotPeriod[];
}

export interface Talent {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  role?: string | null;
  startedWithMeAt?: string | null;
  endedWithMeAt?: string | null;
  firstJobAt?: string | null;
  studyPlace?: string | null;
  studyStartAt?: string | null;
  studyEndAt?: string | null;
  slideUrl?: string | null;
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
  debtRows: TalentDebtRow[];
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

export interface TaxObligationInstallment {
  id: string;
  number: number;
  amount: string;
  dueDate?: string | null;
  status: string;
  paidDate?: string | null;
  transactionId?: string | null;
}

export interface TaxObligation {
  id: string;
  name: string;
  year?: number | null;
  dueDate: string;
  amount: string;
  status: string;
  installments?: number | null;
  paidInstallments?: number;
  notes?: string | null;
  installmentRows?: TaxObligationInstallment[];
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

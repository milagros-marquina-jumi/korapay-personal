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
  contractTerm?: string | null;
  notes?: string | null;
  sequenceIndex?: number;
  sequenceTotal?: number;
  incomeDistributions?: TalentIncomeDistribution[];
}

export interface TalentIncomeDistribution {
  id: string;
  contractId?: string | null;
  talentId?: string | null;
  exchangeRate?: string | null;
  date?: string | null;
  year?: number | null;
  month?: number | null;
  paymentType: string;
  companyName?: string | null;
  clientName?: string | null;
  salary?: string | null;
  amountWithDiscount: string;
  amountReceived: string;
  amountRetained: string;
  status: string;
  notes?: string | null;
}

export interface TalentDebtRow {
  id: string;
  date: string;
  description: string;
  debt: string;
  pending: string;
  status: string;
  debtOwner?: string;
  updatedAt?: string;
}

export interface TalentReport {
  income: { salary: string; withDiscount: string; receivedByMe: string; keptByTalent: string };
  expense: { paid: string; debt: string; pending: string; fraudLoss: string };
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
  byCompany: { name: string; received: string; kept: string; salary: string; payments: number }[];
  byClient: { name: string; received: string; kept: string }[];
  byPaymentType: { name: string; received: string; kept: string; count: number }[];
  expenseByCategory: { name: string; paid: string; debt: string; pending: string }[];
}

export interface TalentPivotPeriod {
  year: number;
  month: number;
  label: string;
  total: string;
  cells: { name: string; amount: string }[];
}

export interface TalentMonthlyDetail {
  year: number;
  month: number;
  label: string;
  talents: { name: string; withDiscount: string; received: string; kept: string }[];
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
    fraudLoss: string;
  };
  incomeByPerson: {
    talentId: string;
    name: string;
    salary: string;
    withDiscount: string;
    received: string;
    kept: string;
    status: string;
    role: string | null;
  }[];
  expenseByPerson: {
    talentId: string;
    name: string;
    paid: string;
    debt: string;
    pending: string;
    count: number;
    status: string;
    role: string | null;
  }[];
  projection: {
    year: number;
    month: number;
    label: string;
    rows: {
      talentId: string;
      talent: string;
      company: string;
      client: string;
      received: string;
      retained: string;
      withDiscount: string;
      from: string;
    }[];
    totalReceived: string;
    totalRetained: string;
    totalWithDiscount: string;
  };
  yearlyByTalent: {
    talentId: string;
    name: string;
    status: string;
    role: string | null;
    years: { year: number; received: string; paid: string; count: number }[];
  }[];
  monthlyDetail?: TalentMonthlyDetail[];
  incomePivot: TalentPivotPeriod[];
  expensePivot: TalentPivotPeriod[];
  byCompany: { name: string; received: string; kept: string; salary: string; talents: string[]; payments: number }[];
  byClient: { name: string; received: string; kept: string; talents: string[] }[];
  byPaymentType: { name: string; received: string; kept: string; count: number }[];
  expenseByCategory: { name: string; paid: string; debt: string; pending: string }[];
  timeSeries: { year: number; month: number; label: string; income: string; expense: string; net: string }[];
  profitabilityByPerson: {
    talentId: string;
    name: string;
    received: string;
    paid: string;
    net: string;
    margin: string;
    status: string;
    role: string | null;
  }[];
}

export interface Talent {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  terminationReason?: string | null;
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
  portalScope?: 'DEBTS' | 'DEBTS_EXPENSES';
  contracts?: TalentContract[];
  looseDistributions?: TalentIncomeDistribution[];
}

export interface TalentLedgerEntry {
  id: string;
  talentId: string;
  date: string;
  year: number;
  month: number;
  type: string;
  debtOwner?: string;
  category?: string | null;
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
  pendingOwedToMe: string;
  pendingOwedByMe: string;
  netBalance: string;
  balance: string;
}

export interface TalentSummaryTotals {
  totalPaid: string;
  totalDebt: string;
  totalPending: string;
  pendingOwedToMe: string;
  pendingOwedByMe: string;
  netBalance: string;
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
  owner?: { name: string };
  talent: { id: string; name: string; status: string };
  scope?: 'DEBTS' | 'DEBTS_EXPENSES';
  summary: TalentSummaryTotals;
  debtRows: TalentDebtRow[];
}

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
  notes?: string | null;
  companyName?: string | null;
  grossSalary?: string | null;
  state?: 'ACTIVE' | 'EXPIRING' | 'FINISHED';
  daysRemaining?: number | null;
  sequence?: number;
  sequenceTotal?: number;
  clients?: { id: string; name: string }[];
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

export interface CompanyDurationPeriod {
  id: string;
  startDate: string;
  endDate: string | null;
  position?: string | null;
  type?: string | null;
  active: boolean;
  days: number;
}

export interface CompanyDuration {
  name: string;
  contracts: number;
  totalDays: number;
  active: boolean;
  firstStart: string | null;
  lastEnd: string | null;
  periods: CompanyDurationPeriod[];
}

export interface TaxObligationInstallment {
  id: string;
  number: number;
  amount: string;
  principalAmount?: string | null;
  interestAmount?: string | null;
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
  totals?: {
    principal: string;
    interest: string;
    total: string;
    surchargePct: string;
  } | null;
}

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
  id: string;
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

export interface SavingBucket {
  bucket: string;
  bank?: string | null;
  currency: string;
  periods: number;
}

export interface SavingLastPeriod {
  year: number;
  month: number;
  label: string;
  accounts: { bucket: string; bank?: string | null; currency: string; amount: string }[];
}

export interface SavingYearlyPivot {
  monthNames: string[];
  rows: { year: number; months: string[]; total: string }[];
  monthTotals: string[];
  grandTotal: string;
}

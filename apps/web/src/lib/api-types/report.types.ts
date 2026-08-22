import type { CompanyDuration } from './employment.types';

export interface PersonalMatrices {
  expenseByMonth: MonthlyMatrixRow[];
  incomeByMonth: MonthlyMatrixRow[];
  fixedByMonth: MonthlyMatrixRow[];
  variableByMonth: MonthlyMatrixRow[];
}

export interface PersonalReports {
  matrices?: PersonalMatrices;
  years: number[];
  yearlyTotals: { year: number; income: string; expense: string; net: string; fixed: string; variable: string }[];
  yearlyByCategory: { year: number; categories: { name: string; total: string }[] }[];
  expenseByCategory: { name: string; total: string }[];
  incomeVsExpense: { year: number; month: number; label: string; income: string; expense: string; net: string }[];
  savingsEvolution: { year: number; month: number; label: string; total: string }[];
  fixedVsVariable: { fixed: string; variable: string };
  monthlyFixedVsVariable: { year: number; month: number; label: string; fixed: string; variable: string }[];
}

export interface MonthlyMatrixRow {
  year: number;
  months: string[];
  total: string;
}

export interface QuarterMatrixRow {
  year: number;
  quarters: string[];
  total: string;
}

export interface EmploymentBreakdown {
  monthlyAll: MonthlyMatrixRow[];
  monthlySalary: MonthlyMatrixRow[];
  quarterlyAll: QuarterMatrixRow[];
  quarterlySalary: QuarterMatrixRow[];
}

export interface CompanyProfitability {
  name: string;
  total: string;
  months: number;
  payments: number;
  monthlyAverage: string;
  salaryAverage?: string;
  salaryMonths?: number;
  bestMonthAmount: string;
  bestMonthLabel: string | null;
  firstDate: string | null;
  lastDate: string | null;
}

export interface TaxBurdenYear {
  year: number;
  income: string;
  accruedTax: string;
  accruedNet: string;
  accruedRate: number;
  cashTax: string;
  cashNet: string;
  cashRate: number;
  cashTaxYear: number | null;
  cashTaxStatus: string | null;
}

export interface TaxBurden {
  rows: TaxBurdenYear[];
  totals: {
    income: string;
    accruedTax: string;
    accruedNet: string;
    accruedRate: number;
    cashTax: string;
    cashNet: string;
  };
  unmatchedTaxYears: number[];
}

export interface EmploymentReports {
  breakdown: EmploymentBreakdown;
  taxBurden?: TaxBurden;
  companyProfitability: CompanyProfitability[];
  years: number[];
  total: string;
  receivable?: { overdue: string; pending: string };
  yearlyTotals: { year: number; total: string; average: string; months: number; companies: number }[];
  companiesPerMonth: {
    year: number;
    months: number[];
    monthDetail: { name: string; clients: string[] }[][];
    total: number;
    totalDetail: { name: string; clients: string[] }[];
  }[];
  companyDurations: CompanyDuration[];
  incomeByConcept: { name: string; total: string }[];
  incomeByCompany: { name: string; total: string }[];
  incomeByMonth: { year: number; month: number; label: string; total: string }[];
}

export interface BusinessReports {
  receivedIncome: string;
  incomeUnderReview?: string;
  years: number[];
  income: string;
  cost: string;
  teamPayment: string;
  utility: string;
  costByApp: { name: string; total: string }[];
  costByProject: { name: string; total: string }[];
  costByAppMonth: { name: string; months: string[]; total: string }[];
  teamByPerson: { name: string; total: string }[];
  teamByPersonMonth: { name: string; months: string[]; total: string }[];
  talentBilled: string;
  talentPayout: string;
  talentCommission: string;
  yearlyTotals: {
    year: number;
    income: string;
    grossIncome?: string;
    cost: string;
    teamPayment: string;
    utility: string;
  }[];
  monthlyFlow: {
    year: number;
    month: number;
    label: string;
    income: string;
    grossIncome?: string;
    cost: string;
    teamPayment: string;
    utility: string;
  }[];
  projectCount: number;
  talent: { paid: string; debt: string; pending: string; balance: string };
}

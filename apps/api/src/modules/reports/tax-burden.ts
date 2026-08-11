import Decimal from 'decimal.js';

interface IncomeRow {
  date: Date;
  amountBase: Decimal | string;
}

interface TaxRow {
  year: number | null;
  amount: Decimal | string | null;
  status: string;
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

export interface TaxBurdenTotals {
  income: string;
  accruedTax: string;
  accruedNet: string;
  accruedRate: number;
  cashTax: string;
  cashNet: string;
}

export interface TaxBurden {
  rows: TaxBurdenYear[];
  totals: TaxBurdenTotals;
  unmatchedTaxYears: number[];
}

function rate(tax: Decimal, income: Decimal) {
  if (income.lte(0)) return 0;
  return Number(tax.div(income).mul(100).toFixed(2));
}

// La renta de un ejercicio se declara y paga durante el año siguiente:
// devengado la imputa al año que la genero, caja al año en que sale el dinero.
export function buildTaxBurden(incomes: IncomeRow[], taxes: TaxRow[]): TaxBurden {
  const incomeByYear = new Map<number, Decimal>();
  for (const row of incomes) {
    const year = row.date.getUTCFullYear();
    incomeByYear.set(year, (incomeByYear.get(year) ?? new Decimal(0)).add(new Decimal(row.amountBase)));
  }

  const taxByYear = new Map<number, { amount: Decimal; status: string }>();
  for (const tax of taxes) {
    if (tax.year === null) continue;
    const amount = new Decimal(tax.amount ?? 0);
    const current = taxByYear.get(tax.year);
    taxByYear.set(tax.year, {
      amount: current ? current.amount.add(amount) : amount,
      status: current ? current.status : tax.status,
    });
  }

  const years = [...new Set([...incomeByYear.keys(), ...taxByYear.keys()])].sort((a, b) => a - b);

  const rows: TaxBurdenYear[] = years
    .filter((year) => incomeByYear.has(year))
    .map((year) => {
      const income = incomeByYear.get(year) ?? new Decimal(0);
      const accrued = taxByYear.get(year);
      const accruedTax = accrued?.amount ?? new Decimal(0);
      const cash = taxByYear.get(year - 1);
      const cashTax = cash?.amount ?? new Decimal(0);

      return {
        year,
        income: income.toFixed(2),
        accruedTax: accruedTax.toFixed(2),
        accruedNet: income.sub(accruedTax).toFixed(2),
        accruedRate: rate(accruedTax, income),
        cashTax: cashTax.toFixed(2),
        cashNet: income.sub(cashTax).toFixed(2),
        cashRate: rate(cashTax, income),
        cashTaxYear: cash ? year - 1 : null,
        cashTaxStatus: cash?.status ?? null,
      };
    });

  const sum = (pick: (r: TaxBurdenYear) => string) =>
    rows.reduce((acc, r) => acc.add(new Decimal(pick(r))), new Decimal(0));

  const totalIncome = sum((r) => r.income);
  const totalAccrued = sum((r) => r.accruedTax);
  const totalCash = sum((r) => r.cashTax);

  return {
    rows,
    totals: {
      income: totalIncome.toFixed(2),
      accruedTax: totalAccrued.toFixed(2),
      accruedNet: totalIncome.sub(totalAccrued).toFixed(2),
      accruedRate: rate(totalAccrued, totalIncome),
      cashTax: totalCash.toFixed(2),
      cashNet: totalIncome.sub(totalCash).toFixed(2),
    },
    unmatchedTaxYears: [...taxByYear.keys()].filter((y) => !incomeByYear.has(y)).sort((a, b) => a - b),
  };
}

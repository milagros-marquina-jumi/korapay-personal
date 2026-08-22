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

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  currency: string;
  theme: string;
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

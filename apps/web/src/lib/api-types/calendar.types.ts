export type CalendarSource = 'TRANSACTION' | 'TALENT_LEDGER' | 'TAX' | 'CONTRACT' | 'SUBSCRIPTION';

export type CalendarKind = 'PAYMENT' | 'COLLECTION' | 'CONTRACT_END';

export type CalendarStatus = 'PENDING' | 'REVIEW' | 'OVERDUE' | 'PAID';

export interface CalendarEvent {
  id: string;
  source: CalendarSource;
  kind: CalendarKind;
  title: string;
  date: string;
  amount: string | null;
  currency: string;
  workspaceId: string;
  workspaceName: string;
  status: CalendarStatus;
  daysUntil: number;
  href: string;
}

export interface CalendarSummary {
  toPay: string;
  toPayCount: number;
  toCollect: string;
  toCollectCount: number;
  overdue: string;
  overdueCount: number;
  next30Count: number;
}

export interface CalendarResponse {
  events: CalendarEvent[];
  summary: CalendarSummary;
}

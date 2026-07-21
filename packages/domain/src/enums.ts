export const WorkspaceType = {
  PERSONAL: 'PERSONAL',
  EMPLOYMENT: 'EMPLOYMENT',
  BUSINESS: 'BUSINESS',
  SHARED: 'SHARED',
  SAVINGS: 'SAVINGS',
  DEBTS: 'DEBTS',
  PROJECT: 'PROJECT',
  TRAVEL: 'TRAVEL',
  HOUSEHOLD: 'HOUSEHOLD',
  TALENT_MANAGEMENT: 'TALENT_MANAGEMENT',
} as const;
export type WorkspaceType = (typeof WorkspaceType)[keyof typeof WorkspaceType];
export const WorkspaceRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
  SUMMARY: 'SUMMARY',
} as const;
export type WorkspaceRole = (typeof WorkspaceRole)[keyof typeof WorkspaceRole];
export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  SAVING: 'SAVING',
  DEBT: 'DEBT',
  DEBT_PAYMENT: 'DEBT_PAYMENT',
  TRANSFER: 'TRANSFER',
  BUSINESS_COST: 'BUSINESS_COST',
  TEAM_PAYMENT: 'TEAM_PAYMENT',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];
export const TransactionStatus = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
  PARTIAL: 'PARTIAL',
  CANCELLED: 'CANCELLED',
  PENDING_REVIEW: 'PENDING_REVIEW',
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];
export const Currency = {
  PEN: 'PEN',
  USD: 'USD',
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];
export const AccountKind = {
  SAVINGS: 'SAVINGS',
  CHECKING: 'CHECKING',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  DIGITAL_WALLET: 'DIGITAL_WALLET',
  CASH: 'CASH',
  PAYPAL: 'PAYPAL',
  OTHER: 'OTHER',
} as const;
export type AccountKind = (typeof AccountKind)[keyof typeof AccountKind];
export const ImportBatchStatus = {
  UPLOADED: 'UPLOADED',
  ANALYZING: 'ANALYZING',
  READY: 'READY',
  IMPORTING: 'IMPORTING',
  COMPLETED: 'COMPLETED',
  COMPLETED_WITH_WARNINGS: 'COMPLETED_WITH_WARNINGS',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK',
} as const;
export type ImportBatchStatus = (typeof ImportBatchStatus)[keyof typeof ImportBatchStatus];
export const ImportIssueSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SENSITIVE_DATA: 'SENSITIVE_DATA',
  DUPLICATE: 'DUPLICATE',
} as const;
export type ImportIssueSeverity = (typeof ImportIssueSeverity)[keyof typeof ImportIssueSeverity];
export const PersonStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type PersonStatus = (typeof PersonStatus)[keyof typeof PersonStatus];
export const RecurrenceFrequency = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;
export type RecurrenceFrequency = (typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency];
export const BASE_CURRENCY: Currency = 'PEN';
export const TIMEZONE = 'America/Lima';
export const LOCALE = 'es-PE';

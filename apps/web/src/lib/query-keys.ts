export const queryKeys = {
  profile: () => ['profile'] as const,
  emailSources: () => ['email-sources'] as const,
  detectedTransactions: (filters?: Record<string, unknown>) => ['detected-transactions', filters ?? {}] as const,
  detectedSummary: () => ['detected-summary'] as const,
  reconciliationRules: () => ['reconciliation-rules'] as const,
  workspaces: () => ['workspaces'] as const,
  calendar: (filters?: Record<string, unknown>) => ['calendar', filters ?? {}] as const,
  dashboard: (workspaceId: string) => ['dashboard', workspaceId] as const,
  transactions: (workspaceId: string, filters?: Record<string, unknown>) =>
    ['transactions', workspaceId, filters ?? {}] as const,
  recurrenceOccurrences: (workspaceId: string, ruleId: string) =>
    ['recurrence-occurrences', workspaceId, ruleId] as const,
  accounts: (workspaceId: string) => ['accounts', workspaceId] as const,
  categories: (workspaceId: string) => ['categories', workspaceId] as const,
  companies: (workspaceId: string) => ['companies', workspaceId] as const,
  clients: (workspaceId: string, companyId?: string) => ['clients', workspaceId, companyId ?? 'all'] as const,
  monthlySummary: (workspaceId: string, filters?: Record<string, unknown>) =>
    ['monthly-summary', workspaceId, filters ?? {}] as const,
  people: (workspaceId: string) => ['people', workspaceId] as const,
  savingGoals: (workspaceId: string) => ['saving-goals', workspaceId] as const,
  savingBalances: (workspaceId: string, filters?: Record<string, unknown>) =>
    ['saving-balances', workspaceId, filters ?? {}] as const,
  savingBuckets: (workspaceId: string) => ['saving-buckets', workspaceId] as const,
  savingLastPeriod: (workspaceId: string) => ['saving-last-period', workspaceId] as const,
  savingYearlyPivot: (workspaceId: string) => ['saving-yearly-pivot', workspaceId] as const,
  personalReports: (workspaceId: string, filters?: Record<string, unknown>) =>
    ['personal-reports', workspaceId, filters ?? {}] as const,
  employmentReports: (workspaceId: string, filters?: Record<string, unknown>) =>
    ['employment-reports', workspaceId, filters ?? {}] as const,
  businessReports: (workspaceId: string, filters?: Record<string, unknown>) =>
    ['business-reports', workspaceId, filters ?? {}] as const,
  debts: (workspaceId: string) => ['debts', workspaceId] as const,
  pendingItems: (workspaceId: string) => ['pending-items', workspaceId] as const,
  recurrences: (workspaceId: string) => ['recurrences', workspaceId] as const,
  talents: (workspaceId: string) => ['talents', workspaceId] as const,
  talent: (workspaceId: string, id: string) => ['talents', workspaceId, id] as const,
  talentLedgerSummary: (workspaceId: string) => ['talent-ledger-summary', workspaceId] as const,
  talentLedger: (workspaceId: string, talentId: string, filters?: Record<string, unknown>) =>
    ['talent-ledger', workspaceId, talentId, filters ?? {}] as const,
  talentAudit: (workspaceId: string, talentId: string) => ['talent-audit', workspaceId, talentId] as const,
  talentReport: (workspaceId: string, talentId: string) => ['talent-report', workspaceId, talentId] as const,
  talentGlobalReport: (workspaceId: string, filters?: Record<string, unknown>) =>
    ['talent-global-report', workspaceId, filters ?? {}] as const,
  portal: (token: string) => ['portal', token] as const,
  portalLedger: (token: string, filters?: Record<string, unknown>) => ['portal-ledger', token, filters ?? {}] as const,
  employmentContracts: (workspaceId: string) => ['employment-contracts', workspaceId] as const,
  taxObligations: (workspaceId: string) => ['tax-obligations', workspaceId] as const,
  projects: (workspaceId: string) => ['projects', workspaceId] as const,
  applications: (workspaceId: string) => ['applications', workspaceId] as const,
  currencies: () => ['currencies'] as const,
  paymentMethods: () => ['payment-methods'] as const,
  banks: () => ['banks'] as const,
  globalCompanies: () => ['global-companies'] as const,
  globalClients: () => ['global-clients'] as const,
  exchangeRate: () => ['exchange-rate'] as const,
  exchangeRateHistory: (page?: number, limit?: number) => ['exchange-rate', 'history', page ?? 1, limit ?? 10] as const,
} as const;

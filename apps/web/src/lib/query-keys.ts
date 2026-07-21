export const queryKeys = {
  workspaces: () => ['workspaces'] as const,
  dashboard: (workspaceId: string) => ['dashboard', workspaceId] as const,
  transactions: (workspaceId: string, filters?: Record<string, unknown>) =>
    ['transactions', workspaceId, filters ?? {}] as const,
  accounts: (workspaceId: string) => ['accounts', workspaceId] as const,
  categories: (workspaceId: string) => ['categories', workspaceId] as const,
  companies: (workspaceId: string) => ['companies', workspaceId] as const,
  people: (workspaceId: string) => ['people', workspaceId] as const,
  savingGoals: (workspaceId: string) => ['saving-goals', workspaceId] as const,
  debts: (workspaceId: string) => ['debts', workspaceId] as const,
  pendingItems: (workspaceId: string) => ['pending-items', workspaceId] as const,
  talents: (workspaceId: string) => ['talents', workspaceId] as const,
  talent: (workspaceId: string, id: string) => ['talents', workspaceId, id] as const,
} as const;

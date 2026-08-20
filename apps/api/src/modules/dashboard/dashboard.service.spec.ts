import { DashboardService } from './dashboard.service';

function buildPrismaMock() {
  return {
    transaction: {
      findMany: jest.fn(),
    },
    workspace: {
      findFirst: jest.fn().mockResolvedValue({ type: 'PERSONAL', members: [{ profileId: 'p1', role: 'OWNER' }] }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    account: { findMany: jest.fn().mockResolvedValue([{ id: 'a1', initialBalance: '1000.00' }]) },
    debt: { findMany: jest.fn().mockResolvedValue([]) },
    debtPayment: { findMany: jest.fn().mockResolvedValue([]) },
    pendingItem: { findMany: jest.fn().mockResolvedValue([]) },
    talentIncomeDistribution: { findMany: jest.fn().mockResolvedValue([]) },
    exchangeRate: { findFirst: jest.fn().mockResolvedValue(null) },
  };
}

describe('DashboardService', () => {
  it('aggregates income and expense from transactions', async () => {
    const prisma = buildPrismaMock();
    prisma.transaction.findMany
      .mockResolvedValueOnce([
        { type: 'INCOME', status: 'PAID', amountBase: '5000.00' },
        { type: 'EXPENSE', status: 'PAID', amountBase: '1200.00' },
        { type: 'SAVING', status: 'PAID', amountBase: '800.00' },
      ])
      .mockResolvedValueOnce([
        { type: 'INCOME', amountBase: '5000.00', accountId: 'a1', destAccountId: null },
        { type: 'EXPENSE', amountBase: '1200.00', accountId: 'a1', destAccountId: null },
      ]);

    const service = new DashboardService(prisma as any);
    const summary = await service.getSummary('ws-1');

    expect(summary.ingresos).toBe('5000.00');
    expect(summary.egresos).toBe('1200.00');
    expect(summary.ahorro).toBe('800.00');
    expect(summary.disponible).toBe('4800.00');
  });

  it('suma los ingresos laborales al dashboard personal', async () => {
    const prisma = buildPrismaMock();
    prisma.workspace.findMany.mockResolvedValue([{ id: 'ws-laboral' }]);
    prisma.transaction.findMany
      .mockResolvedValueOnce([{ type: 'EXPENSE', status: 'PAID', amountBase: '1200.00' }])
      .mockResolvedValueOnce([{ amountBase: '5000.00' }, { amountBase: '2500.00' }])
      .mockResolvedValueOnce([]);

    const service = new DashboardService(prisma as any);
    const summary = await service.getSummary('ws-1');

    expect(summary.ingresos).toBe('7500.00');
    expect(summary.egresos).toBe('1200.00');
  });

  it('no mezcla workspaces cuando no es personal', async () => {
    const prisma = buildPrismaMock();
    prisma.workspace.findFirst.mockResolvedValue({ type: 'BUSINESS', members: [{ profileId: 'p1', role: 'OWNER' }] });
    prisma.transaction.findMany
      .mockResolvedValueOnce([{ type: 'INCOME', status: 'PAID', amountBase: '900.00' }])
      .mockResolvedValueOnce([]);

    const service = new DashboardService(prisma as any);
    const summary = await service.getSummary('ws-business');

    expect(summary.ingresos).toBe('900.00');
    expect(prisma.workspace.findMany).not.toHaveBeenCalled();
  });
});

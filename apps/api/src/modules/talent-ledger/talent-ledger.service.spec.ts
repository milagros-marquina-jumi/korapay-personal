import { ForbiddenException } from '@nestjs/common';
import { TalentLedgerService } from './talent-ledger.service';

function buildPrisma() {
  return {
    talentProfile: { findMany: jest.fn(), findFirst: jest.fn() },
    talentLedgerEntry: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    auditLog: { create: jest.fn(), findMany: jest.fn() },
  };
}

const actor = { profileId: 'admin', label: 'ADMIN' };

describe('TalentLedgerService', () => {
  it('summaryByTalent sums pending/paid/debt per talent', async () => {
    const prisma = buildPrisma();
    prisma.talentProfile.findMany.mockResolvedValue([{ id: 't1', name: 'A', status: 'ACTIVE' }]);
    prisma.talentLedgerEntry.findMany.mockResolvedValue([
      { talentId: 't1', paidAmount: '100', debtAmount: '0', pendingAmount: '40' },
      { talentId: 't1', paidAmount: '50', debtAmount: '10', pendingAmount: '0' },
    ]);
    const svc = new TalentLedgerService(prisma as never);
    const rows = await svc.summaryByTalent('ws');
    const row = rows[0]!;
    expect(row.totalPaid).toBe('150.00');
    expect(row.totalDebt).toBe('10.00');
    expect(row.totalPending).toBe('40.00');
    expect(row.balance).toBe('40.00');
  });

  it('create derives year/month from date and writes audit', async () => {
    const prisma = buildPrisma();
    prisma.talentProfile.findFirst.mockResolvedValue({ id: 't1', workspaceId: 'ws' });
    prisma.talentLedgerEntry.create.mockResolvedValue({ id: 'e1', talentId: 't1' });
    const svc = new TalentLedgerService(prisma as never);
    await svc.create('ws', 't1', { date: '2026-03-15', type: 'DEUDA', debtAmount: '20' }, 'ADMIN', actor);
    const arg = prisma.talentLedgerEntry.create.mock.calls[0][0].data;
    expect(arg.year).toBe(2026);
    expect(arg.month).toBe(3);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('portal update is rejected when entry belongs to another talent', async () => {
    const prisma = buildPrisma();
    prisma.talentLedgerEntry.findFirst.mockResolvedValue({ id: 'e1', talentId: 'other' });
    const svc = new TalentLedgerService(prisma as never);
    await expect(svc.update('e1', 'ws', { paidAmount: '5' }, actor, 't1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('list applies year and type filters', async () => {
    const prisma = buildPrisma();
    prisma.talentLedgerEntry.findMany.mockResolvedValue([]);
    const svc = new TalentLedgerService(prisma as never);
    await svc.list('ws', { year: 2025, type: 'DEUDA' });
    const where = prisma.talentLedgerEntry.findMany.mock.calls[0][0].where;
    expect(where.year).toBe(2025);
    expect(where.type).toBe('DEUDA');
    expect(where.deletedAt).toBeNull();
  });
});

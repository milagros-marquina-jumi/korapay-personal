import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed blocked in production');
    process.exit(1);
  }
  console.log('Seeding KoraPay database...');
  await prisma.auditLog.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.talentIncomeDistribution.deleteMany();
  await prisma.talentContract.deleteMany();
  await prisma.talentProfile.deleteMany();
  await prisma.savingEntry.deleteMany();
  await prisma.savingGoal.deleteMany();
  await prisma.debtPayment.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.pendingItem.deleteMany();
  await prisma.transactionSplit.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.taxObligation.deleteMany();
  await prisma.employmentContract.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.person.deleteMany();
  await prisma.company.deleteMany();
  await prisma.client.deleteMany();
  await prisma.project.deleteMany();
  await prisma.application.deleteMany();
  await prisma.importIssue.deleteMany();
  await prisma.importSheet.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.profile.deleteMany();
  const profile = await prisma.profile.create({
    data: {
      authId: 'demo-user-id',
      name: 'Diego Garcia',
      email: 'demo@korapay.local',
      currency: 'PEN',
      theme: 'system',
    },
  });
  const personal = await prisma.workspace.create({
    data: {
      name: 'Personal',
      type: 'PERSONAL',
      description: 'Finanzas personales',
      emoji: '🏠',
      currency: 'PEN',
    },
  });
  const mimotech = await prisma.workspace.create({
    data: {
      name: 'MIMOTECH',
      type: 'BUSINESS',
      description: 'Ingresos, costos y pagos de MIMOTECH',
      emoji: '🚀',
      currency: 'PEN',
    },
  });
  const mimotalents = await prisma.workspace.create({
    data: {
      name: 'Mimotalents',
      type: 'TALENT_MANAGEMENT',
      description: 'Gestion de talentos y contratos',
      emoji: '🎯',
      currency: 'PEN',
    },
  });
  for (const ws of [personal, mimotech, mimotalents]) {
    await prisma.workspaceMember.create({
      data: { workspaceId: ws.id, profileId: profile.id, role: 'OWNER' },
    });
  }
  const catData = [
    { name: 'Alimentacion', emoji: '🍔', color: 'bg-red-100 text-red-900' },
    { name: 'Transporte', emoji: '🚗', color: 'bg-yellow-100 text-yellow-900' },
    { name: 'Servicios', emoji: '💡', color: 'bg-blue-100 text-blue-900' },
    { name: 'Ingresos', emoji: '💰', color: 'bg-green-100 text-green-900' },
    { name: 'Ocio', emoji: '🎮', color: 'bg-purple-100 text-purple-900' },
    { name: 'Salud', emoji: '🏥', color: 'bg-pink-100 text-pink-900' },
    { name: 'Vivienda', emoji: '🏠', color: 'bg-indigo-100 text-indigo-900' },
    {
      name: 'Costos Operativos',
      emoji: '⚙️',
      color: 'bg-orange-100 text-orange-900',
    },
    { name: 'Suscripciones', emoji: '🔄', color: 'bg-cyan-100 text-cyan-900' },
    { name: 'Pagos Equipo', emoji: '👥', color: 'bg-teal-100 text-teal-900' },
  ];
  const categories: Record<string, string> = {};
  for (const ws of [personal, mimotech, mimotalents]) {
    for (const cat of catData) {
      const c = await prisma.category.create({
        data: { workspaceId: ws.id, ...cat },
      });
      if (ws.id === personal.id) categories[cat.name] = c.id;
    }
  }
  const people = await Promise.all([
    prisma.person.create({
      data: {
        workspaceId: personal.id,
        name: 'Maria Lopez',
        email: 'maria@example.com',
        initials: 'ML',
        color: 'bg-pink-100',
      },
    }),
    prisma.person.create({
      data: {
        workspaceId: personal.id,
        name: 'Carlos Ruiz',
        email: 'carlos@example.com',
        initials: 'CR',
        color: 'bg-blue-100',
      },
    }),
  ]);
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        workspaceId: personal.id,
        name: 'TechCorp SAC',
        ruc: '20123456789',
      },
    }),
    prisma.company.create({
      data: {
        workspaceId: personal.id,
        name: 'DataServices EIRL',
        ruc: '20987654321',
      },
    }),
    prisma.company.create({
      data: { workspaceId: mimotech.id, name: 'MIMOTECH', ruc: '20999888777' },
    }),
  ]);
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        workspaceId: mimotech.id,
        name: 'KoraPay',
        description: 'App financiera',
        emoji: '💎',
      },
    }),
    prisma.project.create({
      data: {
        workspaceId: mimotech.id,
        name: 'Helpmeet',
        description: 'Plataforma de reuniones',
        emoji: '🤝',
      },
    }),
    prisma.project.create({
      data: {
        workspaceId: mimotech.id,
        name: 'Tracklink',
        description: 'Seguimiento de enlaces',
        emoji: '🔗',
      },
    }),
  ]);
  const apps = await Promise.all([
    prisma.application.create({
      data: {
        workspaceId: mimotech.id,
        name: 'Vercel',
        provider: 'Vercel Inc.',
        category: 'Hosting',
      },
    }),
    prisma.application.create({
      data: {
        workspaceId: mimotech.id,
        name: 'Supabase',
        provider: 'Supabase Inc.',
        category: 'Database',
      },
    }),
    prisma.application.create({
      data: {
        workspaceId: mimotech.id,
        name: 'GitHub',
        provider: 'GitHub Inc.',
        category: 'Development',
      },
    }),
    prisma.application.create({
      data: {
        workspaceId: mimotech.id,
        name: 'Figma',
        provider: 'Figma Inc.',
        category: 'Design',
      },
    }),
    prisma.application.create({
      data: {
        workspaceId: mimotech.id,
        name: 'Resend',
        provider: 'Resend Inc.',
        category: 'Email',
      },
    }),
  ]);
  for (const app of apps) {
    await prisma.subscription.create({
      data: {
        workspaceId: mimotech.id,
        applicationId: app.id,
        plan: 'Pro',
        amount: '20.00',
        currency: 'USD',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
      },
    });
  }
  const bcpAhorros = await prisma.account.create({
    data: {
      workspaceId: personal.id,
      name: 'BCP Ahorros',
      bank: 'BCP',
      kind: 'SAVINGS',
      currency: 'PEN',
      lastFour: '4521',
      initialBalance: '3500.00',
      color: 'bg-blue-100 text-blue-900',
      emoji: '🏦',
    },
  });
  const interbank = await prisma.account.create({
    data: {
      workspaceId: personal.id,
      name: 'Interbank Corriente',
      bank: 'Interbank',
      kind: 'CHECKING',
      currency: 'PEN',
      lastFour: '7891',
      initialBalance: '1200.00',
      color: 'bg-orange-100 text-orange-900',
      emoji: '💳',
    },
  });
  const efectivo = await prisma.account.create({
    data: {
      workspaceId: personal.id,
      name: 'Efectivo',
      bank: 'Efectivo',
      kind: 'CASH',
      currency: 'PEN',
      initialBalance: '500.00',
      color: 'bg-green-100 text-green-900',
      emoji: '💵',
    },
  });
  const txData = [
    {
      type: 'INCOME',
      concept: 'Sueldo TechCorp',
      amount: '5000.00',
      date: '2026-06-01',
      accountId: bcpAhorros.id,
      categoryName: 'Ingresos',
      companyId: companies[0]?.id,
    },
    {
      type: 'INCOME',
      concept: 'Freelance DataServices',
      amount: '1200.00',
      date: '2026-06-15',
      accountId: interbank.id,
      categoryName: 'Ingresos',
      companyId: companies[1]?.id,
    },
    {
      type: 'INCOME',
      concept: 'Sueldo TechCorp',
      amount: '5000.00',
      date: '2026-07-01',
      accountId: bcpAhorros.id,
      categoryName: 'Ingresos',
      companyId: companies[0]?.id,
    },
    {
      type: 'EXPENSE',
      concept: 'Supermercado semanal',
      amount: '250.00',
      date: '2026-06-03',
      accountId: bcpAhorros.id,
      categoryName: 'Alimentacion',
    },
    {
      type: 'EXPENSE',
      concept: 'Gasolina',
      amount: '180.00',
      date: '2026-06-05',
      accountId: bcpAhorros.id,
      categoryName: 'Transporte',
    },
    {
      type: 'EXPENSE',
      concept: 'Luz del mes',
      amount: '120.00',
      date: '2026-06-10',
      accountId: interbank.id,
      categoryName: 'Servicios',
    },
    {
      type: 'EXPENSE',
      concept: 'Internet + Cable',
      amount: '149.90',
      date: '2026-06-10',
      accountId: interbank.id,
      categoryName: 'Servicios',
    },
    {
      type: 'EXPENSE',
      concept: 'Cine con amigos',
      amount: '45.00',
      date: '2026-06-12',
      accountId: efectivo.id,
      categoryName: 'Ocio',
    },
    {
      type: 'EXPENSE',
      concept: 'Farmacia',
      amount: '85.00',
      date: '2026-06-15',
      accountId: efectivo.id,
      categoryName: 'Salud',
    },
    {
      type: 'EXPENSE',
      concept: 'Alquiler julio',
      amount: '850.00',
      date: '2026-07-01',
      accountId: bcpAhorros.id,
      categoryName: 'Vivienda',
    },
    {
      type: 'SAVING',
      concept: 'Ahorro mensual',
      amount: '500.00',
      date: '2026-06-01',
      accountId: bcpAhorros.id,
      categoryName: 'Ingresos',
    },
    {
      type: 'SAVING',
      concept: 'Ahorro mensual',
      amount: '500.00',
      date: '2026-07-01',
      accountId: bcpAhorros.id,
      categoryName: 'Ingresos',
    },
  ];
  for (const t of txData) {
    await prisma.transaction.create({
      data: {
        workspaceId: personal.id,
        type: t.type as any,
        concept: t.concept,
        date: new Date(t.date),
        amountOriginal: t.amount,
        currency: 'PEN',
        amountBase: t.amount,
        categoryId: categories[t.categoryName] ?? null,
        accountId: t.accountId ?? null,
        companyId: t.companyId ?? null,
        status: 'PAID',
      },
    });
  }
  const mimotechBcp = await prisma.account.create({
    data: {
      workspaceId: mimotech.id,
      name: 'BCP Negocio',
      bank: 'BCP',
      kind: 'CHECKING',
      currency: 'PEN',
      lastFour: '9102',
      initialBalance: '15000.00',
      color: 'bg-purple-100 text-purple-900',
      emoji: '🏢',
    },
  });
  const mimotechTx = [
    {
      type: 'INCOME',
      concept: 'Proyecto KoraPay',
      amount: '8000.00',
      date: '2026-06-15',
      projectId: projects[0]?.id,
    },
    {
      type: 'INCOME',
      concept: 'Proyecto Helpmeet',
      amount: '5000.00',
      date: '2026-06-20',
      projectId: projects[1]?.id,
    },
    {
      type: 'INCOME',
      concept: 'Tracklink mantenimiento',
      amount: '3000.00',
      date: '2026-07-01',
      projectId: projects[2]?.id,
    },
    {
      type: 'BUSINESS_COST',
      concept: 'Vercel Pro',
      amount: '20.00',
      date: '2026-06-01',
      applicationId: apps[0]?.id,
    },
    {
      type: 'BUSINESS_COST',
      concept: 'Supabase Pro',
      amount: '25.00',
      date: '2026-06-01',
      applicationId: apps[1]?.id,
    },
    {
      type: 'BUSINESS_COST',
      concept: 'GitHub Team',
      amount: '4.00',
      date: '2026-06-01',
      applicationId: apps[2]?.id,
    },
    {
      type: 'BUSINESS_COST',
      concept: 'Figma Professional',
      amount: '15.00',
      date: '2026-06-01',
      applicationId: apps[3]?.id,
    },
    {
      type: 'TEAM_PAYMENT',
      concept: 'Pago equipo junio',
      amount: '3000.00',
      date: '2026-06-30',
    },
  ];
  for (const t of mimotechTx) {
    await prisma.transaction.create({
      data: {
        workspaceId: mimotech.id,
        type: t.type as any,
        concept: t.concept,
        date: new Date(t.date),
        amountOriginal: t.amount,
        currency: 'PEN',
        amountBase: t.amount,
        accountId: mimotechBcp.id,
        projectId: t.projectId ?? null,
        applicationId: t.applicationId ?? null,
        status: 'PAID',
      },
    });
  }
  await prisma.pendingItem.create({
    data: {
      workspaceId: personal.id,
      kind: 'COBRAR',
      concept: 'Freelance pendiente julio',
      amount: '800.00',
      currency: 'PEN',
      dueDate: new Date('2026-07-25'),
      status: 'PENDING',
      personId: people[0]?.id,
    },
  });
  const debt = await prisma.debt.create({
    data: {
      workspaceId: personal.id,
      direction: 'DEBO',
      concept: 'Prestamo personal',
      originalAmount: '3000.00',
      currency: 'PEN',
      dueDate: new Date('2026-12-31'),
      status: 'PARTIAL',
      personId: people[1]?.id,
    },
  });
  await prisma.debtPayment.create({
    data: {
      debtId: debt.id,
      amount: '1000.00',
      date: new Date('2026-07-01'),
      method: 'Transferencia',
    },
  });
  const goal = await prisma.savingGoal.create({
    data: {
      workspaceId: personal.id,
      name: 'Viaje a Cusco',
      targetAmount: '5000.00',
      currency: 'PEN',
      targetDate: new Date('2026-12-31'),
      monthlyRecommend: '833.33',
    },
  });
  await prisma.savingEntry.create({
    data: {
      goalId: goal.id,
      amount: '1000.00',
      type: 'CONTRIBUTION',
      date: new Date('2026-06-15'),
    },
  });
  await prisma.savingEntry.create({
    data: {
      goalId: goal.id,
      amount: '1000.00',
      type: 'CONTRIBUTION',
      date: new Date('2026-07-15'),
    },
  });
  const talent = await prisma.talentProfile.create({
    data: {
      workspaceId: mimotalents.id,
      name: 'Ana Torres',
      email: 'ana@example.com',
      status: 'ACTIVE',
    },
  });
  await prisma.talentContract.create({
    data: {
      talentProfileId: talent.id,
      companyId: companies[0]?.id,
      position: 'Frontend Developer',
      rate: '3500.00',
      currency: 'PEN',
      startDate: new Date('2026-01-01'),
      status: 'ACTIVE',
    },
  });
  console.log('Seed completed successfully!');
  console.log(`Profile: ${profile.email}`);
  console.log(`Workspaces: ${personal.name}, ${mimotech.name}, ${mimotalents.name}`);
  console.log(`Accounts: ${bcpAhorros.name}, ${interbank.name}, ${efectivo.name}, ${mimotechBcp.name}`);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

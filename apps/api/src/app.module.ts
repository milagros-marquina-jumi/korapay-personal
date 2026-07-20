import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './common/auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AccountModule } from './modules/account/account.module';
import { AuditModule } from './modules/audit/audit.module';
import { CategoryModule } from './modules/category/category.module';
import { CompanyModule } from './modules/company/company.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DebtModule } from './modules/debt/debt.module';
import { HealthModule } from './modules/health/health.module';
import { PendingItemModule } from './modules/pending-item/pending-item.module';
import { PersonModule } from './modules/person/person.module';
import { SavingGoalModule } from './modules/saving-goal/saving-goal.module';
import { TalentModule } from './modules/talent/talent.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    HealthModule,
    WorkspaceModule,
    TransactionModule,
    AccountModule,
    CategoryModule,
    PersonModule,
    CompanyModule,
    DashboardModule,
    PendingItemModule,
    DebtModule,
    SavingGoalModule,
    AuditModule,
    TalentModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { AuthModule } from './common/auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AccountModule } from './modules/account/account.module';
import { AuditModule } from './modules/audit/audit.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CategoryModule } from './modules/category/category.module';
import { CompanyModule } from './modules/company/company.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DebtModule } from './modules/debt/debt.module';
import { DetectedTransactionsModule } from './modules/detected-transactions/detected-transactions.module';
import { EmailIngestionModule } from './modules/email-ingestion/email-ingestion.module';
import { EmailSourcesModule } from './modules/email-sources/email-sources.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';
import { HealthModule } from './modules/health/health.module';
import { PendingItemModule } from './modules/pending-item/pending-item.module';
import { PersonModule } from './modules/person/person.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ReconciliationRulesModule } from './modules/reconciliation-rules/reconciliation-rules.module';
import { SavingGoalModule } from './modules/saving-goal/saving-goal.module';
import { TalentModule } from './modules/talent/talent.module';
import { TalentLedgerModule } from './modules/talent-ledger/talent-ledger.module';
import { TalentPortalModule } from './modules/talent-portal/talent-portal.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env.local', '../../.env'],
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
    ProfileModule,
    TalentModule,
    TalentLedgerModule,
    TalentPortalModule,
    CatalogModule,
    ExchangeRateModule,
    EmailSourcesModule,
    EmailIngestionModule,
    DetectedTransactionsModule,
    ReconciliationRulesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}

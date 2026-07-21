import { Module } from '@nestjs/common';
import { ReconciliationRulesController } from './reconciliation-rules.controller';
import { ReconciliationRulesService } from './reconciliation-rules.service';

@Module({
  controllers: [ReconciliationRulesController],
  providers: [ReconciliationRulesService],
})
export class ReconciliationRulesModule {}

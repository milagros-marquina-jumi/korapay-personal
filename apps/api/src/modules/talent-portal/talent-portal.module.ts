import { Module } from '@nestjs/common';
import { TalentLedgerModule } from '../talent-ledger/talent-ledger.module';
import { TalentPortalController } from './talent-portal.controller';
import { TalentPortalService } from './talent-portal.service';

@Module({
  imports: [TalentLedgerModule],
  controllers: [TalentPortalController],
  providers: [TalentPortalService],
})
export class TalentPortalModule {}

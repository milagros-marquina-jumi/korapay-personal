import { Module } from '@nestjs/common';
import { TalentLedgerController } from './talent-ledger.controller';
import { TalentLedgerService } from './talent-ledger.service';

@Module({
  controllers: [TalentLedgerController],
  providers: [TalentLedgerService],
  exports: [TalentLedgerService],
})
export class TalentLedgerModule {}

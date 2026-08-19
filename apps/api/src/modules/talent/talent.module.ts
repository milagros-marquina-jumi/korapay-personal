import { Module } from '@nestjs/common';
import { TalentController } from './talent.controller';
import { TalentService } from './talent.service';
import { TalentIncomeSyncService } from './talent-income-sync.service';
@Module({
  controllers: [TalentController],
  providers: [TalentService, TalentIncomeSyncService],
  exports: [TalentService],
})
export class TalentModule {}

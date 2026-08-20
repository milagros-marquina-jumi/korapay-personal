import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ExchangeRateModule } from '@/modules/exchange-rate/exchange-rate.module';
import { RecurrenceModule } from '@/modules/recurrence/recurrence.module';
import { ScheduledTasksService } from './scheduled-tasks.service';

@Module({
  imports: [ScheduleModule.forRoot(), ExchangeRateModule, RecurrenceModule],
  providers: [ScheduledTasksService],
})
export class ScheduledTasksModule {}

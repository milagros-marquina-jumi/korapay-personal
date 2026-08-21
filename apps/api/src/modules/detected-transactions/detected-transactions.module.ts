import { Module } from '@nestjs/common';
import { ExchangeRateModule } from '@/modules/exchange-rate/exchange-rate.module';
import { DetectedTransactionsController } from './detected-transactions.controller';
import { DetectedTransactionsService } from './detected-transactions.service';

@Module({
  imports: [ExchangeRateModule],
  controllers: [DetectedTransactionsController],
  providers: [DetectedTransactionsService],
})
export class DetectedTransactionsModule {}

import { Module } from '@nestjs/common';
import { DetectedTransactionsController } from './detected-transactions.controller';
import { DetectedTransactionsService } from './detected-transactions.service';

@Module({
  controllers: [DetectedTransactionsController],
  providers: [DetectedTransactionsService],
})
export class DetectedTransactionsModule {}

import { Module } from '@nestjs/common';
import { ExchangeRateModule } from '@/modules/exchange-rate/exchange-rate.module';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [ExchangeRateModule],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}

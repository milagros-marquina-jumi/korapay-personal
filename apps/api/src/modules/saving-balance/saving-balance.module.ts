import { Module } from '@nestjs/common';
import { ExchangeRateModule } from '@/modules/exchange-rate/exchange-rate.module';
import { SavingBalanceController } from './saving-balance.controller';
import { SavingBalanceService } from './saving-balance.service';

@Module({
  imports: [ExchangeRateModule],
  controllers: [SavingBalanceController],
  providers: [SavingBalanceService],
  exports: [SavingBalanceService],
})
export class SavingBalanceModule {}

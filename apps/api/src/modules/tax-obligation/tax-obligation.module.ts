import { Module } from '@nestjs/common';
import { TaxObligationController } from './tax-obligation.controller';
import { TaxObligationService } from './tax-obligation.service';

@Module({
  controllers: [TaxObligationController],
  providers: [TaxObligationService],
  exports: [TaxObligationService],
})
export class TaxObligationModule {}

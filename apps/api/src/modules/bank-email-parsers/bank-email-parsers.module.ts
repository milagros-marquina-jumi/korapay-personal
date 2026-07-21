import { Module } from '@nestjs/common';
import { BankEmailParsersService } from './bank-email-parsers.service';

@Module({
  providers: [BankEmailParsersService],
  exports: [BankEmailParsersService],
})
export class BankEmailParsersModule {}

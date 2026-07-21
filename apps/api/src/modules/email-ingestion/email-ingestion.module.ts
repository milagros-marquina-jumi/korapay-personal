import { Module } from '@nestjs/common';
import { BankEmailParsersModule } from '../bank-email-parsers/bank-email-parsers.module';
import { EmailIngestionController } from './email-ingestion.controller';
import { EmailIngestionService } from './email-ingestion.service';
import { IngestionGuard } from './ingestion.guard';

@Module({
  imports: [BankEmailParsersModule],
  controllers: [EmailIngestionController],
  providers: [EmailIngestionService, IngestionGuard],
})
export class EmailIngestionModule {}

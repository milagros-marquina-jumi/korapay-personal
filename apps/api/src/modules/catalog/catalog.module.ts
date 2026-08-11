import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { ContractIncomeService } from './contract-income.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, ContractIncomeService],
})
export class CatalogModule {}

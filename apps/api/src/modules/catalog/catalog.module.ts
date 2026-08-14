import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { ContractIncomeService } from './contract-income.service';
import { RucLookupService } from './ruc-lookup.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, ContractIncomeService, RucLookupService],
})
export class CatalogModule {}

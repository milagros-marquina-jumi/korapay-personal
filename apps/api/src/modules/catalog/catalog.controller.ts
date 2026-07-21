import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('applications')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'List applications' })
  applications(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.applications(workspaceId);
  }

  @Get('projects')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'List projects' })
  projects(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.projects(workspaceId);
  }

  @Get('employment-contracts')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'List employment contracts' })
  employmentContracts(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.employmentContracts(workspaceId);
  }

  @Get('tax-obligations')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'List tax obligations' })
  taxObligations(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.taxObligations(workspaceId);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'List payment methods' })
  paymentMethods() {
    return this.catalogService.paymentMethods();
  }

  @Get('currencies')
  @ApiOperation({ summary: 'List currencies' })
  currencies() {
    return this.catalogService.currencies();
  }

  @Get('banks')
  @ApiOperation({ summary: 'List banks' })
  banks() {
    return this.catalogService.banks();
  }

  @Get('exchange-rate')
  @ApiOperation({ summary: 'Latest exchange rate' })
  exchangeRate() {
    return this.catalogService.exchangeRate();
  }
}

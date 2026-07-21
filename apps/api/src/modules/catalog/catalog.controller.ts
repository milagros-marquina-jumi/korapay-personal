import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import {
  CreateApplicationDto,
  CreateBankDto,
  CreateCurrencyDto,
  CreateProjectDto,
  NamedCatalogDto,
  UpdateApplicationDto,
  UpdateBankDto,
  UpdateProjectDto,
} from './catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ---- Applications (por workspace) ----
  @Get('applications')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'List applications' })
  applications(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.applications(workspaceId);
  }

  @Post('applications')
  @UseGuards(WorkspaceGuard)
  createApplication(@Body() body: CreateApplicationDto) {
    return this.catalogService.createApplication(body);
  }

  @Patch('applications/:id')
  @UseGuards(WorkspaceGuard)
  updateApplication(
    @Param('id') id: string,
    @Query() { workspaceId }: WorkspaceQueryDto,
    @Body() body: UpdateApplicationDto,
  ) {
    return this.catalogService.updateApplication(id, workspaceId, { ...body });
  }

  @Delete('applications/:id')
  @UseGuards(WorkspaceGuard)
  removeApplication(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.removeApplication(id, workspaceId);
  }

  // ---- Projects (por workspace) ----
  @Get('projects')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'List projects' })
  projects(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.projects(workspaceId);
  }

  @Post('projects')
  @UseGuards(WorkspaceGuard)
  createProject(@Body() body: CreateProjectDto) {
    return this.catalogService.createProject(body);
  }

  @Patch('projects/:id')
  @UseGuards(WorkspaceGuard)
  updateProject(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateProjectDto) {
    return this.catalogService.updateProject(id, workspaceId, { ...body });
  }

  @Delete('projects/:id')
  @UseGuards(WorkspaceGuard)
  removeProject(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.removeProject(id, workspaceId);
  }

  // ---- Read-only por workspace ----
  @Get('employment-contracts')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'List employment contracts' })
  employmentContracts(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.catalogService.employmentContracts(workspaceId);
  }

  // ---- Payment methods (global) ----
  @Get('payment-methods')
  @ApiOperation({ summary: 'List payment methods' })
  paymentMethods() {
    return this.catalogService.paymentMethods();
  }

  @Post('payment-methods')
  createPaymentMethod(@Body() body: NamedCatalogDto) {
    return this.catalogService.createPaymentMethod(body);
  }

  @Patch('payment-methods/:id')
  updatePaymentMethod(@Param('id') id: string, @Body() body: NamedCatalogDto) {
    return this.catalogService.updatePaymentMethod(id, body);
  }

  @Delete('payment-methods/:id')
  removePaymentMethod(@Param('id') id: string) {
    return this.catalogService.removePaymentMethod(id);
  }

  // ---- Currencies (global) ----
  @Get('currencies')
  @ApiOperation({ summary: 'List currencies' })
  currencies() {
    return this.catalogService.currencies();
  }

  @Post('currencies')
  createCurrency(@Body() body: CreateCurrencyDto) {
    return this.catalogService.createCurrency(body);
  }

  @Delete('currencies/:id')
  removeCurrency(@Param('id') id: string) {
    return this.catalogService.removeCurrency(id);
  }

  // ---- Banks (global) ----
  @Get('banks')
  @ApiOperation({ summary: 'List banks' })
  banks() {
    return this.catalogService.banks();
  }

  @Post('banks')
  createBank(@Body() body: CreateBankDto) {
    return this.catalogService.createBank(body);
  }

  @Patch('banks/:id')
  updateBank(@Param('id') id: string, @Body() body: UpdateBankDto) {
    return this.catalogService.updateBank(id, body);
  }

  @Delete('banks/:id')
  removeBank(@Param('id') id: string) {
    return this.catalogService.removeBank(id);
  }
}

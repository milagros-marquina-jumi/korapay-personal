import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CreateTaxObligationDto, UpdateTaxObligationDto } from './tax-obligation.dto';
import { TaxObligationService } from './tax-obligation.service';

@ApiTags('TaxObligations')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('tax-obligations')
export class TaxObligationController {
  constructor(private readonly taxObligationService: TaxObligationService) {}

  @Get()
  @ApiOperation({ summary: 'List tax obligations' })
  findAll(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.taxObligationService.findAll(workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create tax obligation' })
  create(@Body() body: CreateTaxObligationDto) {
    return this.taxObligationService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tax obligation' })
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateTaxObligationDto) {
    return this.taxObligationService.update(id, workspaceId, { ...body });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete tax obligation' })
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.taxObligationService.remove(id, workspaceId);
  }

  @Post(':id/installments/:installmentId/pay')
  @ApiOperation({ summary: 'Mark installment as paid (creates personal expense)' })
  payInstallment(
    @Param('id') id: string,
    @Param('installmentId') installmentId: string,
    @Query() { workspaceId }: WorkspaceQueryDto,
  ) {
    return this.taxObligationService.payInstallment(id, workspaceId, installmentId);
  }

  @Post(':id/installments/:installmentId/unpay')
  @ApiOperation({ summary: 'Revert installment payment (removes personal expense)' })
  unpayInstallment(
    @Param('id') id: string,
    @Param('installmentId') installmentId: string,
    @Query() { workspaceId }: WorkspaceQueryDto,
  ) {
    return this.taxObligationService.unpayInstallment(id, workspaceId, installmentId);
  }
}

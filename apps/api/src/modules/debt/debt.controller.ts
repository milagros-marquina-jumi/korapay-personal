import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { AddDebtPaymentDto, CreateDebtDto, UpdateDebtDto } from './debt.dto';
import { DebtService } from './debt.service';
@ApiTags('Debts')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('debts')
export class DebtController {
  constructor(private readonly debtService: DebtService) {}
  @Get()
  findAll(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.debtService.findAll(workspaceId);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.debtService.findOne(id, workspaceId);
  }
  @Post()
  create(@Body() body: CreateDebtDto) {
    return this.debtService.create(body);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateDebtDto) {
    return this.debtService.update(id, workspaceId, { ...body });
  }
  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: AddDebtPaymentDto) {
    return this.debtService.addPayment(id, workspaceId, { ...body });
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete debt' })
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.debtService.remove(id, workspaceId);
  }
}

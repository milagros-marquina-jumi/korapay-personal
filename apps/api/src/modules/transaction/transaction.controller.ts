import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { TransactionService } from './transaction.service';
@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
  @Get()
  @ApiOperation({ summary: 'List transactions' })
  @ApiQuery({ name: 'workspaceId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(@Query() query: Record<string, string>) {
    return this.transactionService.findAll({
      workspaceId: query.workspaceId!,
      page: query.page ? Number(query.page) : undefined,
      pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
      type: query.type,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findOne(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.transactionService.findOne(id, workspaceId);
  }
  @Post()
  @ApiOperation({ summary: 'Create transaction' })
  create(@Body() body: Record<string, unknown>) {
    return this.transactionService.create(body as any);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction' })
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.transactionService.update(id, workspaceId, body);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete transaction' })
  remove(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.transactionService.remove(id, workspaceId);
  }
  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate transaction' })
  duplicate(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.transactionService.duplicate(id, workspaceId);
  }
  @Post(':id/status')
  @ApiOperation({ summary: 'Change transaction status' })
  changeStatus(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body('status') status: string) {
    return this.transactionService.changeStatus(id, workspaceId, status);
  }
  @Post('transfers')
  @ApiOperation({ summary: 'Create transfer (atomic)' })
  transfer(@Body() body: Record<string, unknown>) {
    return this.transactionService.transfer(body as any);
  }
}

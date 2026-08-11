import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import {
  ChangeTransactionStatusDto,
  CreateTransactionDto,
  DuplicateTransactionDto,
  ListTransactionsDto,
  MonthlySummaryDto,
  TransferDto,
  UpdateTransactionDto,
} from './transaction.dto';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'List transactions' })
  findAll(@Query() query: ListTransactionsDto) {
    return this.transactionService.findAll(query);
  }

  @Get('monthly-summary')
  @ApiOperation({ summary: 'Monthly summary grouped by company' })
  monthlySummary(@Query() query: MonthlySummaryDto) {
    return this.transactionService.monthlySummary(query);
  }

  @Get('recurrence/:ruleId')
  @ApiOperation({ summary: 'List all occurrences of a recurring payment' })
  recurrenceOccurrences(@Param('ruleId') ruleId: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.transactionService.recurrenceOccurrences(ruleId, workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findOne(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.transactionService.findOne(id, workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create transaction' })
  create(@Body() body: CreateTransactionDto) {
    return this.transactionService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction' })
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateTransactionDto) {
    return this.transactionService.update(id, workspaceId, { ...body });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete transaction' })
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.transactionService.remove(id, workspaceId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate transaction' })
  duplicate(
    @Param('id') id: string,
    @Query() { workspaceId }: WorkspaceQueryDto,
    @Body() body: DuplicateTransactionDto,
  ) {
    return this.transactionService.duplicate(id, workspaceId, { year: body?.year, month: body?.month });
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Change transaction status' })
  changeStatus(
    @Param('id') id: string,
    @Query() { workspaceId }: WorkspaceQueryDto,
    @Body() { status }: ChangeTransactionStatusDto,
  ) {
    return this.transactionService.changeStatus(id, workspaceId, status);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Create transfer (atomic)' })
  transfer(@Body() body: TransferDto) {
    return this.transactionService.transfer(body);
  }
}

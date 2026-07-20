import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { DebtService } from './debt.service';
@ApiTags('Debts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('debts')
export class DebtController {
  constructor(private readonly debtService: DebtService) {}
  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.debtService.findAll(workspaceId);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.debtService.findOne(id, workspaceId);
  }
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.debtService.create(body as any);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.debtService.update(id, workspaceId, body);
  }
  @Post(':id/payments')
  addPayment(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.debtService.addPayment(id, workspaceId, body as any);
  }
}

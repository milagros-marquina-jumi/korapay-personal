import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { PendingItemService } from './pending-item.service';
@ApiTags('Pending Items')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('pending-items')
export class PendingItemController {
  constructor(private readonly pendingItemService: PendingItemService) {}
  @Get()
  findAll(@Query('workspaceId') workspaceId: string, @Query('status') status?: string) {
    return this.pendingItemService.findAll(workspaceId, status);
  }
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.pendingItemService.create(body as any);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.pendingItemService.update(id, workspaceId, body);
  }
  @Post(':id/payments')
  pay(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.pendingItemService.pay(id, workspaceId);
  }
}

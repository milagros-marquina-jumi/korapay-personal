import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CreatePendingItemDto, ListPendingItemsDto, PayPendingItemDto, UpdatePendingItemDto } from './pending-item.dto';
import { PendingItemService } from './pending-item.service';
@ApiTags('Pending Items')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('pending-items')
export class PendingItemController {
  constructor(private readonly pendingItemService: PendingItemService) {}
  @Get()
  findAll(@Query() { workspaceId, status }: ListPendingItemsDto) {
    return this.pendingItemService.findAll(workspaceId, status);
  }
  @Post()
  create(@Body() body: CreatePendingItemDto) {
    return this.pendingItemService.create(body);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdatePendingItemDto) {
    return this.pendingItemService.update(id, workspaceId, { ...body });
  }
  @Post(':id/payments')
  pay(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: PayPendingItemDto) {
    return this.pendingItemService.pay(id, workspaceId, { ...body });
  }
  @Delete(':id')
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.pendingItemService.remove(id, workspaceId);
  }
}

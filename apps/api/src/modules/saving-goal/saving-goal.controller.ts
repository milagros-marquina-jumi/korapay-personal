import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { SavingGoalService } from './saving-goal.service';
@ApiTags('Saving Goals')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('saving-goals')
export class SavingGoalController {
  constructor(private readonly savingGoalService: SavingGoalService) {}
  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.savingGoalService.findAll(workspaceId);
  }
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.savingGoalService.create(body as any);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.savingGoalService.update(id, workspaceId, body);
  }
  @Post(':id/entries')
  addEntry(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.savingGoalService.addEntry(id, workspaceId, body as any);
  }
}

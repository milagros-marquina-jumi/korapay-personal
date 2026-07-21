import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { AddSavingEntryDto, CreateSavingGoalDto, UpdateSavingGoalDto } from './saving-goal.dto';
import { SavingGoalService } from './saving-goal.service';
@ApiTags('Saving Goals')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('saving-goals')
export class SavingGoalController {
  constructor(private readonly savingGoalService: SavingGoalService) {}
  @Get()
  findAll(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.savingGoalService.findAll(workspaceId);
  }
  @Post()
  create(@Body() body: CreateSavingGoalDto) {
    return this.savingGoalService.create(body);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateSavingGoalDto) {
    return this.savingGoalService.update(id, workspaceId, { ...body });
  }
  @Post(':id/entries')
  addEntry(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: AddSavingEntryDto) {
    return this.savingGoalService.addEntry(id, workspaceId, { ...body });
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete saving goal' })
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.savingGoalService.remove(id, workspaceId);
  }
}

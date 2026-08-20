import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CreateRecurrenceDto, ListRecurrenceDto, UpdateRecurrenceDto } from './recurrence.dto';
import { RecurrenceService } from './recurrence.service';

@ApiTags('Recurrences')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('recurrences')
export class RecurrenceController {
  constructor(private readonly service: RecurrenceService) {}

  @Get()
  @ApiOperation({ summary: 'List recurrence templates' })
  findAll(@Query() { workspaceId, status }: ListRecurrenceDto) {
    return this.service.findAll(workspaceId, status);
  }

  @Post()
  @ApiOperation({ summary: 'Create recurrence template' })
  create(@Body() body: CreateRecurrenceDto) {
    return this.service.create(body);
  }

  @Post('run')
  @ApiOperation({ summary: 'Generate pending transactions due today' })
  run(@Query() _query: WorkspaceQueryDto) {
    return this.service.generarPendientes();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.service.findOne(id, workspaceId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateRecurrenceDto) {
    return this.service.update(id, workspaceId, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Stop generating future transactions' })
  cancel(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.service.cancel(id, workspaceId);
  }

  @Post(':id/reactivate')
  reactivate(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.service.reactivate(id, workspaceId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.service.remove(id, workspaceId);
  }
}

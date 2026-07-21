import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { AuditQueryDto, CreateTalentLedgerDto, ListTalentLedgerDto, UpdateTalentLedgerDto } from './talent-ledger.dto';
import { type LedgerActor, TalentLedgerService } from './talent-ledger.service';

@ApiTags('TalentLedger')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('talent-ledger')
export class TalentLedgerController {
  constructor(private readonly service: TalentLedgerService) {}

  private actor(userId: string): LedgerActor {
    return { profileId: userId, label: 'ADMIN' };
  }

  @Get()
  @ApiOperation({ summary: 'List talent ledger entries' })
  list(@Query() query: ListTalentLedgerDto) {
    const { workspaceId, ...filters } = query;
    return this.service.list(workspaceId, filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Ledger totals per talent' })
  summary(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.service.summaryByTalent(workspaceId);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Ledger audit history (admin only)' })
  audit(@Query() { workspaceId, talentId }: AuditQueryDto) {
    return this.service.auditHistory(workspaceId, talentId);
  }

  @Post()
  create(@Body() body: CreateTalentLedgerDto, @CurrentUser('sub') userId: string) {
    const { workspaceId, talentId, ...data } = body;
    return this.service.create(workspaceId, talentId, data, 'ADMIN', this.actor(userId));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateTalentLedgerDto, @CurrentUser('sub') userId: string) {
    const { workspaceId, ...data } = body;
    return this.service.update(id, workspaceId, data, this.actor(userId));
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @CurrentUser('sub') userId: string) {
    return this.service.remove(id, workspaceId, this.actor(userId));
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { TalentService } from './talent.service';
@ApiTags('Talents')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('talents')
export class TalentController {
  constructor(private readonly talentService: TalentService) {}
  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.talentService.findAll(workspaceId);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.talentService.findOne(id, workspaceId);
  }
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.talentService.create(body as any);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.talentService.update(id, workspaceId, body);
  }
  @Delete(':id')
  remove(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.talentService.remove(id, workspaceId);
  }
}

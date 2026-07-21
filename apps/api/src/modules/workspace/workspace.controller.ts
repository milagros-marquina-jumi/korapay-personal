import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspace.dto';
import { WorkspaceService } from './workspace.service';
@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}
  @Get()
  @ApiOperation({ summary: 'List user workspaces' })
  findAll(@CurrentUser('sub') userId: string) {
    return this.workspaceService.findAll(userId);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.workspaceService.findOne(id, userId);
  }
  @Post()
  @ApiOperation({ summary: 'Create workspace' })
  create(@Body() body: CreateWorkspaceDto, @CurrentUser('sub') userId: string) {
    return this.workspaceService.create({ ...body, profileId: userId });
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  update(@Param('id') id: string, @Body() body: UpdateWorkspaceDto) {
    return this.workspaceService.update(id, { ...body });
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Archive workspace' })
  remove(@Param('id') id: string) {
    return this.workspaceService.remove(id);
  }
  @Get(':id/members')
  @ApiOperation({ summary: 'Get workspace members' })
  getMembers(@Param('id') id: string) {
    return this.workspaceService.getMembers(id);
  }
}

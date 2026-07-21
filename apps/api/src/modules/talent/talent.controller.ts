import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CreateTalentContractDto, CreateTalentDistributionDto, CreateTalentDto, UpdateTalentDto } from './talent.dto';
import { TalentService } from './talent.service';
@ApiTags('Talents')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('talents')
export class TalentController {
  constructor(private readonly talentService: TalentService) {}
  @Get()
  findAll(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.talentService.findAll(workspaceId);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.talentService.findOne(id, workspaceId);
  }
  @Post()
  create(@Body() body: CreateTalentDto) {
    return this.talentService.create(body);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateTalentDto) {
    return this.talentService.update(id, workspaceId, { ...body });
  }
  @Delete(':id')
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.talentService.remove(id, workspaceId);
  }
  @Post(':id/contracts')
  @ApiOperation({ summary: 'Create talent contract' })
  addContract(
    @Param('id') id: string,
    @Query() { workspaceId }: WorkspaceQueryDto,
    @Body() body: CreateTalentContractDto,
  ) {
    return this.talentService.addContract(id, workspaceId, body);
  }
  @Post('contracts/:contractId/distributions')
  @ApiOperation({ summary: 'Create income distribution' })
  addDistribution(
    @Param('contractId') contractId: string,
    @Query() { workspaceId }: WorkspaceQueryDto,
    @Body() body: CreateTalentDistributionDto,
  ) {
    return this.talentService.addDistribution(contractId, workspaceId, body);
  }
  @Post(':id/access-token')
  @ApiOperation({ summary: 'Generate talent portal access token' })
  generateToken(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.talentService.generateAccessToken(id, workspaceId);
  }
  @Delete(':id/access-token')
  @ApiOperation({ summary: 'Revoke talent portal access token' })
  revokeToken(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.talentService.revokeAccessToken(id, workspaceId);
  }
}

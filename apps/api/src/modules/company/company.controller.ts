import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './company.dto';
import { CompanyService } from './company.service';
@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  @Get()
  findAll(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.companyService.findAll(workspaceId);
  }
  @Post()
  create(@Body() body: CreateCompanyDto) {
    return this.companyService.create(body);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateCompanyDto) {
    return this.companyService.update(id, workspaceId, { ...body });
  }
  @Delete(':id')
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.companyService.remove(id, workspaceId);
  }
}

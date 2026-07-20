import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { CompanyService } from './company.service';
@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.companyService.findAll(workspaceId);
  }
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.companyService.create(body as any);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.companyService.update(id, workspaceId, body);
  }
  @Delete(':id')
  remove(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.companyService.remove(id, workspaceId);
  }
}

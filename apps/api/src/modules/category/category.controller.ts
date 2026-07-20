import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { CategoryService } from './category.service';
@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.categoryService.findAll(workspaceId);
  }
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.categoryService.create(body as any);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.categoryService.update(id, workspaceId, body);
  }
  @Delete(':id')
  remove(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.categoryService.remove(id, workspaceId);
  }
}

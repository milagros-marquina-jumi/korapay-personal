import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { PersonService } from './person.service';
@ApiTags('People')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('people')
export class PersonController {
  constructor(private readonly personService: PersonService) {}
  @Get()
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.personService.findAll(workspaceId);
  }
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.personService.create(body as any);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.personService.update(id, workspaceId, body);
  }
  @Delete(':id')
  remove(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.personService.remove(id, workspaceId);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CreatePersonDto, ListPeopleDto, UpdatePersonDto } from './person.dto';
import { PersonService } from './person.service';
@ApiTags('People')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('people')
export class PersonController {
  constructor(private readonly personService: PersonService) {}
  @Get()
  findAll(@Query() { workspaceId, kind }: ListPeopleDto) {
    return this.personService.findAll(workspaceId, kind);
  }
  @Post()
  create(@Body() body: CreatePersonDto) {
    return this.personService.create(body);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdatePersonDto) {
    return this.personService.update(id, workspaceId, { ...body });
  }
  @Delete(':id')
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.personService.remove(id, workspaceId);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CreateClientDto, ListClientsDto, UpdateClientDto } from './client.dto';
import { ClientService } from './client.service';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  findAll(@Query() { workspaceId, companyId }: ListClientsDto) {
    return this.clientService.findAll(workspaceId, companyId);
  }

  @Post()
  create(@Body() body: CreateClientDto) {
    return this.clientService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateClientDto) {
    return this.clientService.update(id, workspaceId, { ...body });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.clientService.remove(id, workspaceId);
  }
}

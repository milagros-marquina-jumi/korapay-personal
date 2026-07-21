import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import { CreateAccountDto, UpdateAccountDto } from './account.dto';
import { AccountService } from './account.service';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({ summary: 'List accounts' })
  findAll(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.accountService.findAll(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account with calculated balance' })
  findOne(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.accountService.findOne(id, workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create account' })
  create(@Body() body: CreateAccountDto) {
    return this.accountService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account' })
  update(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto, @Body() body: UpdateAccountDto) {
    return this.accountService.update(id, workspaceId, { ...body });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive account' })
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.accountService.remove(id, workspaceId);
  }
}

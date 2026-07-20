import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import type { AccountService } from './account.service';
@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}
  @Get()
  @ApiOperation({ summary: 'List accounts' })
  findAll(@Query('workspaceId') workspaceId: string) {
    return this.accountService.findAll(workspaceId);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get account with calculated balance' })
  findOne(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.accountService.findOne(id, workspaceId);
  }
  @Post()
  @ApiOperation({ summary: 'Create account' })
  create(@Body() body: Record<string, unknown>) {
    return this.accountService.create(body as any);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update account' })
  update(@Param('id') id: string, @Query('workspaceId') workspaceId: string, @Body() body: Record<string, unknown>) {
    return this.accountService.update(id, workspaceId, body);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Archive account' })
  remove(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    return this.accountService.remove(id, workspaceId);
  }
}

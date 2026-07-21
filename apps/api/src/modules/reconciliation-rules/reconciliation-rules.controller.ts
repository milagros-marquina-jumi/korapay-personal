import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { CreateRuleDto, UpdateRuleDto } from './reconciliation-rules.dto';
import { ReconciliationRulesService } from './reconciliation-rules.service';

@ApiTags('ReconciliationRules')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('reconciliation-rules')
export class ReconciliationRulesController {
  constructor(private readonly service: ReconciliationRulesService) {}

  @Get()
  findAll(@CurrentUser('sub') userId: string) {
    return this.service.findAll(userId);
  }

  @Post()
  create(@Body() body: CreateRuleDto, @CurrentUser('sub') userId: string) {
    return this.service.create(userId, { ...body });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateRuleDto, @CurrentUser('sub') userId: string) {
    return this.service.update(id, userId, { ...body });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.remove(id, userId);
  }

  @Post(':id/toggle')
  toggle(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.toggle(id, userId);
  }
}

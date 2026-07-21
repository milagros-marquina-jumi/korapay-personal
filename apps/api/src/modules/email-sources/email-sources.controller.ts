import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { CreateEmailSourceDto, UpdateEmailSourceDto } from './email-sources.dto';
import { EmailSourcesService } from './email-sources.service';

@ApiTags('EmailSources')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('email-sources')
export class EmailSourcesController {
  constructor(private readonly service: EmailSourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List connected email sources' })
  findAll(@CurrentUser('sub') userId: string) {
    return this.service.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Connect an email source (returns token once)' })
  create(@Body() body: CreateEmailSourceDto, @CurrentUser('sub') userId: string) {
    return this.service.create(userId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateEmailSourceDto, @CurrentUser('sub') userId: string) {
    return this.service.update(id, userId, { ...body });
  }

  @Post(':id/regenerate-token')
  regenerate(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.regenerateToken(id, userId);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.setStatus(id, userId, 'PAUSED');
  }

  @Post(':id/resume')
  resume(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.setStatus(id, userId, 'ACTIVE');
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.remove(id, userId);
  }
}

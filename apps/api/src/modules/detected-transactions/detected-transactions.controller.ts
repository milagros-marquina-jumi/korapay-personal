import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { BulkActionDto, ConfirmDetectedDto, ListDetectedDto, UpdateDetectedDto } from './detected-transactions.dto';
import { DetectedTransactionsService } from './detected-transactions.service';

@ApiTags('DetectedTransactions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('detected-transactions')
export class DetectedTransactionsController {
  constructor(private readonly service: DetectedTransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List detected bank transactions' })
  findAll(@Query() query: ListDetectedDto, @CurrentUser('sub') userId: string) {
    return this.service.findAll(userId, query);
  }

  @Get('summary')
  summary(@CurrentUser('sub') userId: string) {
    return this.service.summary(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateDetectedDto, @CurrentUser('sub') userId: string) {
    return this.service.update(id, userId, { ...body });
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: ConfirmDetectedDto, @CurrentUser('sub') userId: string) {
    return this.service.confirm(id, userId, body);
  }

  @Post(':id/ignore')
  ignore(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.ignore(id, userId);
  }

  @Post(':id/mark-duplicate')
  markDuplicate(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.markDuplicate(id, userId);
  }

  @Post('bulk-ignore')
  bulkIgnore(@Body() body: BulkActionDto, @CurrentUser('sub') userId: string) {
    return this.service.bulkIgnore(body.ids, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.remove(id, userId);
  }
}

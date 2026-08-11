import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { WorkspaceQueryDto } from '@/common/dto/workspace-query.dto';
import {
  CreateSavingBalancePeriodDto,
  CreateSavingBucketDto,
  RemoveSavingBucketQueryDto,
  RenameSavingBucketDto,
  UpsertSavingBalanceDto,
} from './saving-balance.dto';
import { SavingBalanceService } from './saving-balance.service';

@ApiTags('Saving Balances')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('saving-balances')
export class SavingBalanceController {
  constructor(private readonly savingBalanceService: SavingBalanceService) {}

  @Get('buckets')
  @ApiOperation({ summary: 'Cuentas de ahorro distintas registradas' })
  buckets(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.savingBalanceService.buckets(workspaceId);
  }

  @Get('last-period')
  @ApiOperation({ summary: 'Ultimo periodo registrado con sus cuentas' })
  lastPeriod(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.savingBalanceService.lastPeriod(workspaceId);
  }

  @Get('yearly-pivot')
  @ApiOperation({ summary: 'Totales por anio y mes' })
  yearlyPivot(@Query() { workspaceId }: WorkspaceQueryDto) {
    return this.savingBalanceService.yearlyPivot(workspaceId);
  }

  @Post('periods')
  @ApiOperation({ summary: 'Crear un mes con sus cuentas' })
  createPeriod(@Body() body: CreateSavingBalancePeriodDto) {
    return this.savingBalanceService.createPeriod(body);
  }

  @Put()
  @ApiOperation({ summary: 'Crear o actualizar el saldo de una cuenta en un mes' })
  upsert(@Body() body: UpsertSavingBalanceDto) {
    return this.savingBalanceService.upsertAccount(body);
  }

  @Post('buckets')
  @ApiOperation({ summary: 'Crear una cuenta de ahorro en el ultimo periodo' })
  createBucket(@Body() body: CreateSavingBucketDto) {
    return this.savingBalanceService.createBucket(body);
  }

  @Patch('buckets')
  @ApiOperation({ summary: 'Renombrar una cuenta en todos sus periodos' })
  renameBucket(@Body() body: RenameSavingBucketDto) {
    return this.savingBalanceService.renameBucket(body.workspaceId, body.bucket, body.currency ?? 'PEN', {
      name: body.name,
      bank: body.bank,
    });
  }

  @Delete('buckets')
  @ApiOperation({ summary: 'Soft delete de una cuenta en todos sus periodos' })
  removeBucket(@Query() { workspaceId, bucket, currency }: RemoveSavingBucketQueryDto) {
    return this.savingBalanceService.removeBucket(workspaceId, bucket, currency ?? 'PEN');
  }

  @Delete('periods/:year/:month')
  @ApiOperation({ summary: 'Soft delete de todo un mes' })
  removePeriod(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Query() { workspaceId }: WorkspaceQueryDto,
  ) {
    return this.savingBalanceService.removePeriod(workspaceId, year, month);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete de una cuenta del mes' })
  remove(@Param('id') id: string, @Query() { workspaceId }: WorkspaceQueryDto) {
    return this.savingBalanceService.remove(id, workspaceId);
  }
}

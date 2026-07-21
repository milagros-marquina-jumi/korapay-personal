import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { WorkspaceGuard } from '@/common/auth/workspace.guard';
import { ReportsQueryDto } from './reports.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard, WorkspaceGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('personal')
  @ApiOperation({ summary: 'Personal reports: category, income/expense, savings, fixed/variable' })
  personal(@Query() { workspaceId, year }: ReportsQueryDto) {
    return this.reportsService.personal(workspaceId, year);
  }

  @Get('saving-balances')
  @ApiOperation({ summary: 'Monthly saving balances by account' })
  savingBalances(@Query() { workspaceId, year }: ReportsQueryDto) {
    return this.reportsService.savingBalancesMonthly(workspaceId, year);
  }
}

import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { UpsertExchangeRateDto } from './exchange-rate.dto';
import { ExchangeRateService } from './exchange-rate.service';

@ApiTags('Exchange Rate')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get()
  @ApiOperation({ summary: 'Latest exchange rate' })
  latest() {
    return this.exchangeRateService.getLatest();
  }

  @Get('history')
  @ApiOperation({ summary: 'Exchange rate history (paginated)' })
  history(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.exchangeRateService.history(Number(page) || 1, Number(limit) || 10);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh today rate from SUNAT (Decolecta)' })
  refresh() {
    return this.exchangeRateService.refreshFromDecolecta();
  }

  @Put()
  @ApiOperation({ summary: 'Set/edit exchange rate for a date' })
  upsert(@Body() body: UpsertExchangeRateDto) {
    return this.exchangeRateService.upsert(body.date, body.rate);
  }
}

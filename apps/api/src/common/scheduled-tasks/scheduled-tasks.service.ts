import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExchangeRateService } from '@/modules/exchange-rate/exchange-rate.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(private readonly exchangeRate: ExchangeRateService) {}

  @Cron('0 8 * * *', { name: 'refresh-exchange-rate', timeZone: 'America/Lima' })
  async refreshExchangeRate() {
    this.logger.log('Ejecutando refresh diario del tipo de cambio...');
    try {
      const result = await this.exchangeRate.refreshFromDecolecta();
      this.logger.log(`Tipo de cambio actualizado: 1 USD = ${result.rate} PEN (${result.date})`);
    } catch (err) {
      this.logger.error(`Fallo refresh tipo de cambio: ${(err as Error).message}`);
    }
  }
}

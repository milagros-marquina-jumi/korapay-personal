import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ExchangeRateService } from '@/modules/exchange-rate/exchange-rate.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private readonly exchangeRate: ExchangeRateService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Cron('5 0 * * *', { name: 'flag-overdue', timeZone: 'America/Lima' })
  async flagOverdue() {
    this.logger.log('Marcando movimientos vencidos...');
    try {
      const result = await this.markOverdueTransactions();
      this.logger.log(`Movimientos marcados como vencidos: ${result.count}`);
    } catch (err) {
      this.logger.error(`Fallo marcado de vencidos: ${(err as Error).message}`);
    }
  }

  async markOverdueTransactions() {
    const today = new Date();
    const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    return this.prisma.transaction.updateMany({
      where: {
        deletedAt: null,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { not: null, lt: startOfToday },
      },
      data: { status: 'OVERDUE' },
    });
  }
}

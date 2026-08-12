import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

interface DecolectaExchange {
  buy_price: string;
  sell_price: string;
  base_currency: string;
  quote_currency: string;
  date: string;
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private dayStart(input: string | Date): Date {
    const d = new Date(input);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private async pair() {
    const usd = await this.prisma.currency.findUnique({ where: { code: 'USD' } });
    const pen = await this.prisma.currency.findUnique({ where: { code: 'PEN' } });
    if (!usd || !pen) throw new ServiceUnavailableException('Monedas USD/PEN no configuradas');
    return { usd, pen };
  }

  private serialize(rate: { rate: unknown; date: Date }) {
    return { from: 'USD', to: 'PEN', rate: String(rate.rate), date: rate.date };
  }

  async getLatest() {
    const rate = await this.prisma.exchangeRate.findFirst({ orderBy: { date: 'desc' } });
    return rate ? this.serialize(rate) : null;
  }

  async getRateForDate(date: string | Date): Promise<string> {
    const day = this.dayStart(date);
    const exact = await this.prisma.exchangeRate.findFirst({ where: { date: day } });
    if (exact) return String(exact.rate);
    const previous = await this.prisma.exchangeRate.findFirst({
      where: { date: { lte: day } },
      orderBy: { date: 'desc' },
    });
    if (previous) return String(previous.rate);
    const latest = await this.prisma.exchangeRate.findFirst({ orderBy: { date: 'desc' } });
    if (latest) return String(latest.rate);
    throw new ServiceUnavailableException('No hay tipo de cambio registrado en la base de datos');
  }

  async history(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [rates, total] = await Promise.all([
      this.prisma.exchangeRate.findMany({ orderBy: { date: 'desc' }, skip, take: limit }),
      this.prisma.exchangeRate.count(),
    ]);
    return {
      data: rates.map((r) => this.serialize(r)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async upsert(date: string, rate: string) {
    const { usd, pen } = await this.pair();
    const day = this.dayStart(date);
    const saved = await this.prisma.exchangeRate.upsert({
      where: {
        fromCurrencyId_toCurrencyId_date: { fromCurrencyId: usd.id, toCurrencyId: pen.id, date: day },
      },
      create: { fromCurrencyId: usd.id, toCurrencyId: pen.id, rate, date: day },
      update: { rate },
    });
    return this.serialize(saved);
  }

  async refreshFromDecolecta() {
    const apiKey = this.config.get<string>('DECOLECTA_API_KEY');
    const apiUrl = this.config.get<string>('DECOLECTA_API_URL');
    if (!apiKey || apiKey === 'REEMPLAZAR') {
      throw new ServiceUnavailableException('DECOLECTA_API_KEY no configurado');
    }
    if (!apiUrl) {
      throw new ServiceUnavailableException('DECOLECTA_API_URL no configurado');
    }
    const timeout = Number(this.config.get<string>('DECOLECTA_TIMEOUT_MS'));
    try {
      const data = await this.fetchWithRetry(apiUrl, apiKey, timeout);
      return this.upsert(data.date, data.sell_price);
    } catch (err) {
      this.logger.error(`Error consultando Decolecta: ${(err as Error).message}`);
      const fallback = await this.getLatest();
      if (fallback) return fallback;
      throw new ServiceUnavailableException('No se pudo obtener el tipo de cambio de SUNAT');
    }
  }

  private async fetchWithRetry(apiUrl: string, apiKey: string, timeout: number): Promise<DecolectaExchange> {
    let lastError: Error = new Error('Sin respuesta de Decolecta');

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`${apiUrl}/v1/tipo-cambio/sunat`, {
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(timeout),
        });
        if (res.ok) return (await res.json()) as DecolectaExchange;

        const retryable = res.status >= 500 || res.status === 429;
        lastError = new Error(`Decolecta respondio ${res.status}`);
        if (!retryable) throw lastError;
      } catch (err) {
        lastError = err as Error;
        if (lastError.message.startsWith('Decolecta respondio 4')) throw lastError;
      }

      if (attempt < RETRY_ATTEMPTS) {
        this.logger.warn(`Reintentando Decolecta (${attempt}/${RETRY_ATTEMPTS}): ${lastError.message}`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }

    throw lastError;
  }
}

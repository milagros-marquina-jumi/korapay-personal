import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RUC_REGEX = /^\d{11}$/;
const DEFAULT_TIMEOUT_MS = 10_000;

type DecolectaRucRaw = Record<string, unknown>;

export interface RucLookupResult {
  ruc: string;
  legalName: string;
  status: string | null;
  condition: string | null;
  address: string | null;
}

@Injectable()
export class RucLookupService {
  private readonly logger = new Logger(RucLookupService.name);

  constructor(private readonly config: ConfigService) {}

  async lookup(ruc: string): Promise<RucLookupResult> {
    const limpio = ruc.trim();
    if (!RUC_REGEX.test(limpio)) {
      throw new BadRequestException('El RUC debe tener 11 dígitos');
    }

    const apiKey = this.config.get<string>('DECOLECTA_API_KEY');
    const apiUrl = this.config.get<string>('DECOLECTA_API_URL');
    if (!apiKey || apiKey === 'REEMPLAZAR') {
      throw new ServiceUnavailableException('DECOLECTA_API_KEY no configurado');
    }
    if (!apiUrl) {
      throw new ServiceUnavailableException('DECOLECTA_API_URL no configurado');
    }

    const timeout = Number(this.config.get<string>('DECOLECTA_TIMEOUT_MS')) || DEFAULT_TIMEOUT_MS;

    let res: Response;
    try {
      res = await fetch(`${apiUrl}/v1/sunat/ruc?numero=${limpio}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(timeout),
      });
    } catch (err) {
      this.logger.error(`Error consultando RUC ${limpio}: ${(err as Error).message}`);
      throw new ServiceUnavailableException('No se pudo consultar SUNAT. Intenta de nuevo.');
    }

    if (res.status === 404) throw new NotFoundException(`No se encontró el RUC ${limpio} en SUNAT`);
    if (!res.ok) {
      this.logger.error(`Decolecta respondió ${res.status} para el RUC ${limpio}`);
      throw new ServiceUnavailableException('SUNAT no respondió. Intenta de nuevo.');
    }

    const data = (await res.json()) as DecolectaRucRaw;
    const legalName = texto(data.razon_social);
    if (!legalName) throw new NotFoundException(`No se encontró el RUC ${limpio} en SUNAT`);

    return {
      ruc: texto(data.numero_documento) ?? limpio,
      legalName,
      status: texto(data.estado),
      condition: texto(data.condicion),
      address: texto(data.direccion),
    };
  }
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

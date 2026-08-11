import { Injectable } from '@nestjs/common';
import type { BankEmailParser, IncomingBankEmail, ParsedBankTransaction } from './parser.types';
import {
  AgoraEmailParser,
  BbvaEmailParser,
  BcpEmailParser,
  GenericBankEmailParser,
  InterbankEmailParser,
  PaypalEmailParser,
} from './parsers';

@Injectable()
export class BankEmailParsersService {
  private readonly specific: BankEmailParser[] = [
    new BcpEmailParser(),
    new InterbankEmailParser(),
    new BbvaEmailParser(),
    new AgoraEmailParser(),
    new PaypalEmailParser(),
  ];
  private readonly fallback = new GenericBankEmailParser();

  parse(input: IncomingBankEmail): { parsed: ParsedBankTransaction; parserKey: string } | null {
    for (const parser of this.specific) {
      if (parser.supports(input)) {
        const parsed = parser.parse(input);
        if (parsed) return { parsed, parserKey: parser.key };
      }
    }
    const generic = this.fallback.parse(input);
    if (generic) return { parsed: generic, parserKey: this.fallback.key };
    return null;
  }
}

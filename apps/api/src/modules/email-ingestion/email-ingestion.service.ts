import { createHash } from 'node:crypto';
import { EMAIL_INGESTION_MAX_BODY_LENGTH, NON_EXPENSE_TYPES } from '@korapay/domain';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { BankEmailParsersService } from '../bank-email-parsers/bank-email-parsers.service';
import { buildFingerprint, normalizeMerchant, sanitizeRaw } from '../bank-email-parsers/parser.utils';

interface EmailSourceCtx {
  id: string;
  profileId: string;
  defaultWorkspaceId: string | null;
  defaultAccountId: string | null;
}

interface IngestInput {
  providerMessageId: string;
  providerThreadId: string;
  sender: string;
  subject: string;
  receivedAt: string;
  textBody: string;
}

function sanitizeText(raw: string): string {
  const normalized = raw.replace(/\r\n/g, '\n');
  let out = '';
  for (const ch of normalized) {
    const code = ch.charCodeAt(0);
    if (code === 9 || code === 10 || code >= 32) out += ch;
  }
  return out.slice(0, EMAIL_INGESTION_MAX_BODY_LENGTH);
}

function buildDescription(subject: string, bankName: string): string {
  const cleaned = subject
    .replace(/^(?:notificaci[oó]n|aviso|alerta)\s*[:-]?\s*/i, '')
    .replace(/\s*[-–—]\s*(?:BCP|BBVA|Interbank|Scotiabank).*$/i, '')
    .trim();
  if (cleaned.length >= 3 && cleaned.length <= 80) return cleaned;
  return bankName;
}

@Injectable()
export class EmailIngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parsers: BankEmailParsersService,
  ) {}

  async ingest(source: EmailSourceCtx, input: IngestInput) {
    const textBody = sanitizeText(input.textBody);
    const contentHash = createHash('sha256').update(`${input.subject}\n${textBody}`).digest('hex');
    const receivedAt = new Date(input.receivedAt);

    const existing = await this.prisma.processedEmail.findUnique({
      where: {
        emailSourceId_providerMessageId: { emailSourceId: source.id, providerMessageId: input.providerMessageId },
      },
    });
    if (existing) {
      return { status: 'duplicate', processedEmailId: existing.id, result: 'ALREADY_PROCESSED' };
    }

    const parsedResult = this.parsers.parse({
      sender: input.sender,
      subject: input.subject,
      receivedAt,
      textBody,
    });

    if (!parsedResult) {
      const processed = await this.prisma.processedEmail.create({
        data: {
          emailSourceId: source.id,
          providerMessageId: input.providerMessageId,
          providerThreadId: input.providerThreadId,
          sender: input.sender,
          subject: input.subject,
          receivedAt,
          contentHash,
          processingStatus: 'UNSUPPORTED',
          processedAt: new Date(),
        },
      });
      return { status: 'accepted', processedEmailId: processed.id, detectedTransactionId: null, result: 'UNSUPPORTED' };
    }

    const { parsed, parserKey } = parsedResult;
    const merchantNormalized = normalizeMerchant(parsed.merchant);
    const fingerprint = buildFingerprint({
      bankCode: parsed.bankCode,
      cardLast4: parsed.cardLast4,
      merchantNormalized,
      amount: parsed.amount,
      currency: parsed.currency,
      occurredAt: parsed.occurredAt,
      externalReference: parsed.externalReference,
    });

    const processed = await this.prisma.processedEmail.create({
      data: {
        emailSourceId: source.id,
        providerMessageId: input.providerMessageId,
        providerThreadId: input.providerThreadId,
        sender: input.sender,
        subject: input.subject,
        receivedAt,
        contentHash,
        processingStatus: 'PARSED',
        parserKey,
        processedAt: new Date(),
      },
    });

    const duplicate = await this.prisma.detectedBankTransaction.findFirst({
      where: { profileId: source.profileId, fingerprint, status: { in: ['PENDING_REVIEW', 'CONFIRMED'] } },
    });

    const rule = await this.matchRule(source, parsed, merchantNormalized);
    const suggestedWorkspaceId = rule?.targetWorkspaceId ?? source.defaultWorkspaceId ?? null;
    const suggestedAccountId =
      rule?.targetAccountId ??
      source.defaultAccountId ??
      (await this.matchAccount(suggestedWorkspaceId, parsed.bankCode, parsed.cardLast4, parsed.currency));

    const detected = await this.prisma.detectedBankTransaction.create({
      data: {
        profileId: source.profileId,
        workspaceId: suggestedWorkspaceId,
        emailSourceId: source.id,
        processedEmailId: processed.id,
        accountId: suggestedAccountId,
        categoryId: rule?.targetCategoryId ?? null,
        projectId: rule?.targetProjectId ?? null,
        applicationId: rule?.targetApplicationId ?? null,
        bankCode: parsed.bankCode,
        bankName: parsed.bankName,
        cardLast4: parsed.cardLast4 ?? null,
        merchantOriginal: parsed.merchant ?? null,
        merchantNormalized: merchantNormalized || null,
        description: parsed.merchant ?? parsed.recipient ?? buildDescription(input.subject, parsed.bankName),
        transactionType: parsed.transactionType,
        amount: parsed.amount,
        currency: parsed.currency,
        occurredAt: parsed.occurredAt,
        externalReference: parsed.externalReference ?? null,
        installments: parsed.installments ?? null,
        confidence: parsed.confidence,
        fingerprint,
        status: duplicate ? 'DUPLICATE' : 'PENDING_REVIEW',
        duplicateOfId: duplicate?.id ?? null,
        rawDataSanitized: sanitizeRaw(parsed, input.subject) as Prisma.InputJsonObject,
      },
    });

    await this.prisma.emailSource.update({
      where: { id: source.id },
      data: { lastSuccessfulIngestionAt: new Date() },
    });

    return {
      status: 'accepted',
      processedEmailId: processed.id,
      detectedTransactionId: detected.id,
      result: detected.status,
      nonExpense: NON_EXPENSE_TYPES.includes(parsed.transactionType),
    };
  }

  private async matchRule(
    source: EmailSourceCtx,
    parsed: { bankCode: string; cardLast4?: string },
    merchantNormalized: string,
  ) {
    const rules = await this.prisma.reconciliationRule.findMany({
      where: { profileId: source.profileId, active: true },
      orderBy: { priority: 'asc' },
    });
    for (const rule of rules) {
      if (rule.emailSourceId && rule.emailSourceId !== source.id) continue;
      if (rule.bankCode && rule.bankCode !== parsed.bankCode) continue;
      if (rule.cardLast4 && rule.cardLast4 !== parsed.cardLast4) continue;
      if (rule.merchantPattern && !merchantNormalized.includes(rule.merchantPattern.toUpperCase())) continue;
      return rule;
    }
    return null;
  }

  private async matchAccount(
    workspaceId: string | null,
    _bankCode: string,
    cardLast4: string | undefined,
    currency: string,
  ): Promise<string | null> {
    if (!workspaceId || !cardLast4) return null;
    const matches = await this.prisma.account.findMany({
      where: { workspaceId, lastFour: cardLast4, currency, deletedAt: null },
    });
    return matches.length === 1 && matches[0] ? matches[0].id : null;
  }
}

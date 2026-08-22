export interface EmailSource {
  id: string;
  name: string;
  email: string;
  provider: string;
  status: string;
  defaultWorkspaceId?: string | null;
  defaultAccountId?: string | null;
  tokenPrefix: string;
  lastReceivedAt?: string | null;
  lastSuccessfulIngestionAt?: string | null;
  createdAt: string;
  revokedAt?: string | null;
  pendingCount?: number;
}

export interface EmailSourceCreated {
  source: EmailSource;
  ingestionToken: string;
}

export interface DetectedTransaction {
  id: string;
  workspaceId?: string | null;
  emailSourceId: string;
  emailSource?: { id: string; name: string; email: string } | null;
  accountId?: string | null;
  categoryId?: string | null;
  projectId?: string | null;
  applicationId?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  cardLast4?: string | null;
  merchantOriginal?: string | null;
  merchantNormalized?: string | null;
  description: string;
  transactionType: string;
  amount: string;
  currency: string;
  occurredAt: string;
  externalReference?: string | null;
  installments?: number | null;
  confidence: number;
  status: string;
  transactionId?: string | null;
  rawDataSanitized?: Record<string, unknown> | null;
  createdAt: string;
}

export interface DetectedSummary {
  pendingReview: number;
  highConfidence: number;
  withoutAccount: number;
  duplicates: number;
  failed: number;
}

export interface ReconciliationRule {
  id: string;
  workspaceId: string;
  name: string;
  emailSourceId?: string | null;
  senderPattern?: string | null;
  merchantPattern?: string | null;
  bankCode?: string | null;
  cardLast4?: string | null;
  targetWorkspaceId: string;
  targetAccountId?: string | null;
  targetCategoryId?: string | null;
  autoConfirm: boolean;
  priority: number;
  active: boolean;
}

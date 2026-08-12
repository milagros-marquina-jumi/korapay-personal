-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "auth_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERSONAL',
    "description" TEXT,
    "emoji" TEXT NOT NULL DEFAULT '💰',
    "color" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EDITOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency_id" TEXT NOT NULL,
    "to_currency_id" TEXT NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "color" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'PE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'SAVINGS',
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "last_four" TEXT,
    "holder" TEXT,
    "initial_balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "color" TEXT,
    "emoji" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "global_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "global_company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "global_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "initials" TEXT,
    "color" TEXT,
    "role" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'TEAM',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "salary" DECIMAL(18,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "global_company_id" TEXT,
    "name" TEXT NOT NULL,
    "ruc" TEXT,
    "industry" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "company_id" TEXT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "color" TEXT,
    "emoji" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "category" TEXT,
    "url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "amount_original" DECIMAL(18,2) NOT NULL,
    "amount_gross" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "exchange_rate" DECIMAL(18,6),
    "amount_base" DECIMAL(18,2) NOT NULL,
    "category_id" TEXT,
    "account_id" TEXT,
    "dest_account_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "payment_method_id" TEXT,
    "person_id" TEXT,
    "company_id" TEXT,
    "client_id" TEXT,
    "project_id" TEXT,
    "application_id" TEXT,
    "contract_id" TEXT,
    "linked_transaction_id" TEXT,
    "recurrence_rule_id" TEXT,
    "due_date" DATE,
    "paid_date" DATE,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "receipt_url" TEXT,
    "tags" TEXT[],
    "import_batch_id" TEXT,
    "import_row_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_splits" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "person_id" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "percentage" DECIMAL(7,4),
    "notes" TEXT,

    CONSTRAINT "transaction_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurrence_rules" (
    "id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "end_date" DATE,
    "end_after_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_items" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "person_id" TEXT,
    "concept" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "due_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pending_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "person_id" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'DEBO',
    "concept" TEXT NOT NULL,
    "original_amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "interest_rate" DECIMAL(7,4),
    "due_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "id" TEXT NOT NULL,
    "debt_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "date" DATE NOT NULL,
    "method" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saving_goals" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "target_date" DATE,
    "monthly_recommend" DECIMAL(18,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "saving_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saving_entries" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CONTRIBUTION',
    "date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saving_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saving_balances" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "bank" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "amount_base" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "saving_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_contracts" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "company_id" TEXT,
    "position" TEXT,
    "type" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "salary" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "plan" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "billing_cycle" TEXT,
    "next_renewal" DATE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_obligations" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(18,2),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "installments" INTEGER,
    "paid_installments" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tax_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_obligation_installments" (
    "id" TEXT NOT NULL,
    "tax_obligation_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "due_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_date" DATE,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_obligation_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_profiles" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "person_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "termination_reason" TEXT,
    "role" TEXT,
    "started_with_me_at" DATE,
    "ended_with_me_at" DATE,
    "first_job_at" DATE,
    "study_place" TEXT,
    "study_start_at" DATE,
    "study_end_at" DATE,
    "slide_url" TEXT,
    "notes" TEXT,
    "access_token" TEXT,
    "token_enabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "talent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_ledger_entries" (
    "id" TEXT NOT NULL,
    "talent_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EGRESO',
    "category" TEXT,
    "paid_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "debt_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pending_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ADMIN',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "talent_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_contracts" (
    "id" TEXT NOT NULL,
    "talent_profile_id" TEXT NOT NULL,
    "company_id" TEXT,
    "client_id" TEXT,
    "company_name" TEXT,
    "client_name" TEXT,
    "position" TEXT,
    "payment_type" TEXT,
    "rate" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contract_term" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "talent_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_income_distributions" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT,
    "talent_id" TEXT,
    "transaction_id" TEXT,
    "date" DATE,
    "year" INTEGER,
    "month" INTEGER,
    "payment_type" TEXT NOT NULL DEFAULT 'Mensual',
    "company_name" TEXT,
    "client_name" TEXT,
    "salary" DECIMAL(18,2),
    "amount_with_discount" DECIMAL(18,2) NOT NULL,
    "amount_received" DECIMAL(18,2) NOT NULL,
    "amount_retained" DECIMAL(18,2) NOT NULL,
    "discount_type" TEXT,
    "discount_amount" DECIMAL(18,2),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "talent_income_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_sheets" (
    "id" TEXT NOT NULL,
    "import_batch_id" TEXT NOT NULL,
    "sheet_name" TEXT NOT NULL,
    "sheet_type" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "import_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_issues" (
    "id" TEXT NOT NULL,
    "import_batch_id" TEXT NOT NULL,
    "sheet_name" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "field" TEXT,
    "message" TEXT NOT NULL,
    "raw_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "read_at" TIMESTAMP(3),
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PAYMENT',
    "entity_id" TEXT,
    "entity_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "profile_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sources" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'GMAIL_APPS_SCRIPT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "default_workspace_id" TEXT,
    "default_account_id" TEXT,
    "token_hash" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "last_received_at" TIMESTAMP(3),
    "last_successful_ingestion_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "email_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_emails" (
    "id" TEXT NOT NULL,
    "email_source_id" TEXT NOT NULL,
    "provider_message_id" TEXT NOT NULL,
    "provider_thread_id" TEXT,
    "sender" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "content_hash" TEXT NOT NULL,
    "processing_status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "parser_key" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detected_bank_transactions" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "email_source_id" TEXT NOT NULL,
    "processed_email_id" TEXT NOT NULL,
    "account_id" TEXT,
    "category_id" TEXT,
    "project_id" TEXT,
    "application_id" TEXT,
    "bank_code" TEXT,
    "bank_name" TEXT,
    "card_last4" TEXT,
    "merchant_original" TEXT,
    "merchant_normalized" TEXT,
    "description" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "exchange_rate" DECIMAL(18,6),
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "external_reference" TEXT,
    "installments" INTEGER,
    "confidence" DECIMAL(4,2) NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "transaction_id" TEXT,
    "duplicate_of_id" TEXT,
    "raw_data_sanitized" JSONB,
    "confirmed_at" TIMESTAMP(3),
    "confirmed_by" TEXT,
    "ignored_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detected_bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_rules" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "email_source_id" TEXT,
    "name" TEXT NOT NULL,
    "sender_pattern" TEXT,
    "subject_pattern" TEXT,
    "merchant_pattern" TEXT,
    "bank_code" TEXT,
    "card_last4" TEXT,
    "target_workspace_id" TEXT NOT NULL,
    "target_account_id" TEXT,
    "target_category_id" TEXT,
    "target_project_id" TEXT,
    "target_application_id" TEXT,
    "auto_confirm" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TransactionProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TransactionProjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_auth_id_key" ON "profiles"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "workspaces_status_idx" ON "workspaces"("status");

-- CreateIndex
CREATE INDEX "workspace_members_profile_id_idx" ON "workspace_members"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspace_id_profile_id_key" ON "workspace_members"("workspace_id", "profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_id_to_currency_id_date_key" ON "exchange_rates"("from_currency_id", "to_currency_id", "date");

-- CreateIndex
CREATE INDEX "categories_workspace_id_idx" ON "categories"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "banks_name_key" ON "banks"("name");

-- CreateIndex
CREATE INDEX "accounts_workspace_id_idx" ON "accounts"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_name_key" ON "payment_methods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "global_companies_name_key" ON "global_companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "global_clients_name_key" ON "global_clients"("name");

-- CreateIndex
CREATE INDEX "global_clients_global_company_id_idx" ON "global_clients"("global_company_id");

-- CreateIndex
CREATE INDEX "people_workspace_id_idx" ON "people"("workspace_id");

-- CreateIndex
CREATE INDEX "companies_workspace_id_idx" ON "companies"("workspace_id");

-- CreateIndex
CREATE INDEX "companies_global_company_id_idx" ON "companies"("global_company_id");

-- CreateIndex
CREATE INDEX "clients_workspace_id_idx" ON "clients"("workspace_id");

-- CreateIndex
CREATE INDEX "clients_company_id_idx" ON "clients"("company_id");

-- CreateIndex
CREATE INDEX "projects_workspace_id_idx" ON "projects"("workspace_id");

-- CreateIndex
CREATE INDEX "applications_workspace_id_idx" ON "applications"("workspace_id");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_date_idx" ON "transactions"("workspace_id", "date");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_type_idx" ON "transactions"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_status_idx" ON "transactions"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_person_id_idx" ON "transactions"("workspace_id", "person_id");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_company_id_idx" ON "transactions"("workspace_id", "company_id");

-- CreateIndex
CREATE INDEX "transactions_workspace_id_project_id_idx" ON "transactions"("workspace_id", "project_id");

-- CreateIndex
CREATE INDEX "transactions_import_row_hash_idx" ON "transactions"("import_row_hash");

-- CreateIndex
CREATE INDEX "pending_items_workspace_id_status_idx" ON "pending_items"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "pending_items_workspace_id_due_date_idx" ON "pending_items"("workspace_id", "due_date");

-- CreateIndex
CREATE INDEX "debts_workspace_id_status_idx" ON "debts"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "saving_goals_workspace_id_idx" ON "saving_goals"("workspace_id");

-- CreateIndex
CREATE INDEX "saving_balances_workspace_id_year_month_idx" ON "saving_balances"("workspace_id", "year", "month");

-- CreateIndex
CREATE INDEX "employment_contracts_workspace_id_idx" ON "employment_contracts"("workspace_id");

-- CreateIndex
CREATE INDEX "subscriptions_workspace_id_idx" ON "subscriptions"("workspace_id");

-- CreateIndex
CREATE INDEX "tax_obligations_workspace_id_idx" ON "tax_obligations"("workspace_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_obligation_installments_tax_obligation_id_number_key" ON "tax_obligation_installments"("tax_obligation_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "talent_profiles_access_token_key" ON "talent_profiles"("access_token");

-- CreateIndex
CREATE INDEX "talent_profiles_workspace_id_idx" ON "talent_profiles"("workspace_id");

-- CreateIndex
CREATE INDEX "talent_ledger_entries_talent_id_date_idx" ON "talent_ledger_entries"("talent_id", "date");

-- CreateIndex
CREATE INDEX "talent_ledger_entries_workspace_id_type_idx" ON "talent_ledger_entries"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "talent_ledger_entries_workspace_id_category_idx" ON "talent_ledger_entries"("workspace_id", "category");

-- CreateIndex
CREATE INDEX "talent_contracts_talent_profile_id_idx" ON "talent_contracts"("talent_profile_id");

-- CreateIndex
CREATE INDEX "talent_income_distributions_talent_id_date_idx" ON "talent_income_distributions"("talent_id", "date");

-- CreateIndex
CREATE INDEX "talent_income_distributions_contract_id_idx" ON "talent_income_distributions"("contract_id");

-- CreateIndex
CREATE INDEX "import_batches_workspace_id_idx" ON "import_batches"("workspace_id");

-- CreateIndex
CREATE INDEX "notifications_profile_id_read_at_idx" ON "notifications"("profile_id", "read_at");

-- CreateIndex
CREATE INDEX "calendar_events_workspace_id_date_idx" ON "calendar_events"("workspace_id", "date");

-- CreateIndex
CREATE INDEX "calendar_events_profile_id_date_idx" ON "calendar_events"("profile_id", "date");

-- CreateIndex
CREATE INDEX "audit_logs_workspace_id_created_at_idx" ON "audit_logs"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_profile_id_idx" ON "audit_logs"("profile_id");

-- CreateIndex
CREATE INDEX "email_sources_token_hash_idx" ON "email_sources"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "email_sources_profile_id_provider_email_key" ON "email_sources"("profile_id", "provider", "email");

-- CreateIndex
CREATE INDEX "processed_emails_email_source_id_created_at_idx" ON "processed_emails"("email_source_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "processed_emails_email_source_id_provider_message_id_key" ON "processed_emails"("email_source_id", "provider_message_id");

-- CreateIndex
CREATE INDEX "detected_bank_transactions_profile_id_status_idx" ON "detected_bank_transactions"("profile_id", "status");

-- CreateIndex
CREATE INDEX "detected_bank_transactions_fingerprint_idx" ON "detected_bank_transactions"("fingerprint");

-- CreateIndex
CREATE INDEX "reconciliation_rules_profile_id_active_priority_idx" ON "reconciliation_rules"("profile_id", "active", "priority");

-- CreateIndex
CREATE INDEX "_TransactionProjects_B_index" ON "_TransactionProjects"("B");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_from_currency_id_fkey" FOREIGN KEY ("from_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_to_currency_id_fkey" FOREIGN KEY ("to_currency_id") REFERENCES "currencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_clients" ADD CONSTRAINT "global_clients_global_company_id_fkey" FOREIGN KEY ("global_company_id") REFERENCES "global_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_global_company_id_fkey" FOREIGN KEY ("global_company_id") REFERENCES "global_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_dest_account_id_fkey" FOREIGN KEY ("dest_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_linked_transaction_id_fkey" FOREIGN KEY ("linked_transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurrence_rule_id_fkey" FOREIGN KEY ("recurrence_rule_id") REFERENCES "recurrence_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_items" ADD CONSTRAINT "pending_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saving_goals" ADD CONSTRAINT "saving_goals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saving_entries" ADD CONSTRAINT "saving_entries_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "saving_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saving_balances" ADD CONSTRAINT "saving_balances_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_obligations" ADD CONSTRAINT "tax_obligations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_obligation_installments" ADD CONSTRAINT "tax_obligation_installments_tax_obligation_id_fkey" FOREIGN KEY ("tax_obligation_id") REFERENCES "tax_obligations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_profiles" ADD CONSTRAINT "talent_profiles_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_ledger_entries" ADD CONSTRAINT "talent_ledger_entries_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_ledger_entries" ADD CONSTRAINT "talent_ledger_entries_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_contracts" ADD CONSTRAINT "talent_contracts_talent_profile_id_fkey" FOREIGN KEY ("talent_profile_id") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_income_distributions" ADD CONSTRAINT "talent_income_distributions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "talent_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_income_distributions" ADD CONSTRAINT "talent_income_distributions_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_sheets" ADD CONSTRAINT "import_sheets_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_issues" ADD CONSTRAINT "import_issues_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_email_source_id_fkey" FOREIGN KEY ("email_source_id") REFERENCES "email_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detected_bank_transactions" ADD CONSTRAINT "detected_bank_transactions_email_source_id_fkey" FOREIGN KEY ("email_source_id") REFERENCES "email_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detected_bank_transactions" ADD CONSTRAINT "detected_bank_transactions_processed_email_id_fkey" FOREIGN KEY ("processed_email_id") REFERENCES "processed_emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TransactionProjects" ADD CONSTRAINT "_TransactionProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TransactionProjects" ADD CONSTRAINT "_TransactionProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

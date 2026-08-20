ALTER TABLE "recurrence_rules"
  ADD COLUMN "workspace_id" TEXT,
  ADD COLUMN "type" TEXT,
  ADD COLUMN "concept" TEXT,
  ADD COLUMN "amount" DECIMAL(18,2),
  ADD COLUMN "currency" TEXT,
  ADD COLUMN "category_id" TEXT,
  ADD COLUMN "payment_method" TEXT,
  ADD COLUMN "bank" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "is_fixed_expense" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "next_run_at" DATE,
  ADD COLUMN "last_run_at" DATE,
  ADD COLUMN "generated_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "cancelled_at" TIMESTAMP(3),
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "recurrence_rules"
  ADD CONSTRAINT "recurrence_rules_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recurrence_rules"
  ADD CONSTRAINT "recurrence_rules_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "recurrence_rules_workspace_id_status_idx" ON "recurrence_rules"("workspace_id", "status");
CREATE INDEX "recurrence_rules_status_next_run_at_idx" ON "recurrence_rules"("status", "next_run_at");

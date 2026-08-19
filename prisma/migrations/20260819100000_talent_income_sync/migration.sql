ALTER TABLE "transactions" ADD COLUMN "source_ref" TEXT;
ALTER TABLE "companies" ADD COLUMN "sync_talent_workspace_id" TEXT;
CREATE INDEX "transactions_source_ref_idx" ON "transactions"("source_ref");

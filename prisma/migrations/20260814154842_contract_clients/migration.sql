-- CreateTable
CREATE TABLE "employment_contract_clients" (
    "contract_id" TEXT NOT NULL,
    "global_client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_contract_clients_pkey" PRIMARY KEY ("contract_id","global_client_id")
);

-- CreateIndex
CREATE INDEX "employment_contract_clients_global_client_id_idx" ON "employment_contract_clients"("global_client_id");

-- AddForeignKey
ALTER TABLE "employment_contract_clients" ADD CONSTRAINT "employment_contract_clients_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "employment_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_contract_clients" ADD CONSTRAINT "employment_contract_clients_global_client_id_fkey" FOREIGN KEY ("global_client_id") REFERENCES "global_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

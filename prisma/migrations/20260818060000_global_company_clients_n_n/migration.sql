CREATE TABLE "global_company_clients" (
    "global_company_id" TEXT NOT NULL,
    "global_client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_company_clients_pkey" PRIMARY KEY ("global_company_id","global_client_id")
);

CREATE INDEX "global_company_clients_global_client_id_idx" ON "global_company_clients"("global_client_id");

ALTER TABLE "global_company_clients" ADD CONSTRAINT "global_company_clients_global_company_id_fkey" FOREIGN KEY ("global_company_id") REFERENCES "global_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "global_company_clients" ADD CONSTRAINT "global_company_clients_global_client_id_fkey" FOREIGN KEY ("global_client_id") REFERENCES "global_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "global_company_clients" ("global_company_id", "global_client_id")
SELECT c."global_company_id", c."id"
FROM "global_clients" c
WHERE c."global_company_id" IS NOT NULL
ON CONFLICT DO NOTHING;

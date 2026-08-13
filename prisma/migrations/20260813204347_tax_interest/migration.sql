-- AlterTable
ALTER TABLE "tax_obligation_installments" ADD COLUMN     "interest_amount" DECIMAL(18,2),
ADD COLUMN     "principal_amount" DECIMAL(18,2);

-- AlterTable
ALTER TABLE "tax_obligations" ADD COLUMN     "interest_rate" DECIMAL(7,4);

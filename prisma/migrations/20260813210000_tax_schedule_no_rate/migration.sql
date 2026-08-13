-- El fraccionamiento de SUNAT no se deriva de una tasa: cada cuota trae su
-- propia amortizacion e interes en el anexo. La columna deja de tener sentido.
ALTER TABLE "tax_obligations" DROP COLUMN IF EXISTS "interest_rate";

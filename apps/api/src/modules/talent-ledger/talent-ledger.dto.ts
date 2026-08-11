import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Max, Min } from 'class-validator';

const TYPES = ['EGRESO', 'DEUDA'];
const CATEGORIES = [
  'EDUCACION',
  'SUSCRIPCION',
  'TRABAJO',
  'ALQUILER',
  'PRESTAMO',
  'MOBILIARIO',
  'EQUIPO',
  'TRANSPORTE',
  'COMIDA',
  'FRAUDE',
  'OTRO',
];
const STATUSES = ['PAID', 'PENDING', 'PARTIAL', 'OVERDUE', 'CANCELLED', 'NUNCA_PAGO'];

export class ListTalentLedgerDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsOptional()
  @IsString()
  talentId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(TYPES)
  type?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class AuditQueryDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsOptional()
  @IsString()
  talentId?: string;
}

export class CreateTalentLedgerDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsString()
  @IsNotEmpty()
  talentId!: string;

  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsIn(TYPES)
  type!: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @IsOptional()
  @IsNumberString()
  paidAmount?: string;

  @IsOptional()
  @IsNumberString()
  debtAmount?: string;

  @IsOptional()
  @IsNumberString()
  pendingAmount?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;
}

export class UpdateTalentLedgerDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsIn(TYPES)
  type?: string;

  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @IsOptional()
  @IsNumberString()
  paidAmount?: string;

  @IsOptional()
  @IsNumberString()
  debtAmount?: string;

  @IsOptional()
  @IsNumberString()
  pendingAmount?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;
}

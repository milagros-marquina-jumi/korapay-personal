import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

const TX_TYPES = [
  'INCOME',
  'EXPENSE',
  'SAVING',
  'DEBT',
  'DEBT_PAYMENT',
  'TRANSFER',
  'BUSINESS_COST',
  'TEAM_PAYMENT',
  'ADJUSTMENT',
];
const TX_STATUS = ['PAID', 'PENDING', 'OVERDUE', 'PARTIAL', 'CANCELLED', 'PENDING_REVIEW'];
const RECURRENCE_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

export class CreateTransactionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ enum: TX_TYPES })
  @IsIn(TX_TYPES)
  type!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '1200.50' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ example: '1500.00', description: 'Monto antes de descuentos. Solo si difiere del neto.' })
  @IsOptional()
  @IsNumberString()
  amountGross?: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ example: '3.42' })
  @IsOptional()
  @IsNumberString()
  exchangeRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ enum: TX_STATUS, default: 'PAID' })
  @IsOptional()
  @IsIn(TX_STATUS)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de proyectos asociados (un costo puede tener varios)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projectIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: '2026-08-15', description: 'Fecha de vencimiento del pago' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ default: false, description: 'Indica si es un pago recurrente' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ enum: RECURRENCE_FREQUENCIES })
  @IsOptional()
  @IsIn(RECURRENCE_FREQUENCIES)
  recurrenceFrequency?: string;

  @ApiPropertyOptional({ default: 1, description: 'Cada cuántos periodos se repite' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recurrenceInterval?: number;

  @ApiPropertyOptional({ example: '2027-06-30', description: 'Fin de la recurrencia' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  recurrenceEndDate?: string;

  @ApiPropertyOptional({ description: 'Número de repeticiones antes de finalizar' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  recurrenceCount?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

export class ListTransactionsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ enum: TX_TYPES })
  @IsOptional()
  @IsIn(TX_TYPES)
  type?: string;

  @ApiPropertyOptional({ enum: TX_STATUS })
  @IsOptional()
  @IsIn(TX_STATUS)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  endDate?: string;
}

export class TransferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromAccountId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toAccountId!: string;

  @ApiProperty({ example: '500.00' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'] })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  fee?: string;
}

export class ChangeTransactionStatusDto {
  @ApiProperty({ enum: TX_STATUS })
  @IsIn(TX_STATUS)
  status!: string;
}

export class MonthlySummaryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ enum: TX_TYPES, default: 'INCOME' })
  @IsOptional()
  @IsIn(TX_TYPES)
  type?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;
}

export class DuplicateTransactionDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

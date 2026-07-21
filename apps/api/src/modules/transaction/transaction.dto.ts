import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

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
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
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

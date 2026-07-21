import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TalentReportQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

export class CreateTalentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startedWithMeAt?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endedWithMeAt?: string;

  @ApiPropertyOptional({ example: '2025-03-01' })
  @IsOptional()
  @IsDateString()
  firstJobAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studyPlace?: string;

  @ApiPropertyOptional({ example: '2024-11-01' })
  @IsOptional()
  @IsDateString()
  studyStartAt?: string;

  @ApiPropertyOptional({ example: '2025-06-01' })
  @IsOptional()
  @IsDateString()
  studyEndAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slideUrl?: string;
}

export class UpdateTalentDto extends PartialType(CreateTalentDto) {}

export class CreateTalentContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ enum: ['Planilla', 'RxH', 'Transferencia'] })
  @IsOptional()
  @IsIn(['Planilla', 'RxH', 'Transferencia'])
  paymentType?: string;

  @ApiPropertyOptional({ example: '3500.00' })
  @IsOptional()
  @IsNumberString()
  rate?: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'FINISHED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'FINISHED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTalentContractDto extends PartialType(CreateTalentContractDto) {}

export class CreateTalentDistributionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ enum: ['Mensual', 'Gratificación', 'Liquidación', 'CTS', 'Extra'], default: 'Mensual' })
  @IsOptional()
  @IsIn(['Mensual', 'Gratificación', 'Liquidación', 'CTS', 'Extra'])
  paymentType?: string;

  @ApiPropertyOptional({ example: '4000.00' })
  @IsOptional()
  @IsNumberString()
  salary?: string;

  @ApiProperty({ example: '3200.00' })
  @IsNumberString()
  amountWithDiscount!: string;

  @ApiProperty({ example: '1700.00' })
  @IsNumberString()
  amountReceived!: string;

  @ApiProperty({ example: '1500.00' })
  @IsNumberString()
  amountRetained!: string;

  @ApiPropertyOptional({ enum: ['PAID', 'PENDING', 'PARTIAL', 'OVERDUE', 'CANCELLED'], default: 'PENDING' })
  @IsOptional()
  @IsIn(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTalentDistributionDto extends PartialType(CreateTalentDistributionDto) {}

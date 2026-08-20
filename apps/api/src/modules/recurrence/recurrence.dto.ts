import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
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

export class CreateRecurrenceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] })
  @IsIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
  frequency!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  interval?: number;

  @ApiProperty({ enum: ['EXPENSE', 'INCOME', 'SAVING', 'BUSINESS_COST', 'TEAM_PAYMENT'] })
  @IsIn(['EXPENSE', 'INCOME', 'SAVING', 'BUSINESS_COST', 'TEAM_PAYMENT'])
  type!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept!: string;

  @ApiProperty({ example: '68.40' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isFixedExpense?: boolean;

  @ApiProperty({ example: '2026-09-01', description: 'Primera fecha en que se genera' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'Se detiene al pasar esta fecha' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Se detiene tras generar esta cantidad' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  endAfterCount?: number;
}

export class UpdateRecurrenceDto extends PartialType(CreateRecurrenceDto) {}

export class ListRecurrenceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'CANCELLED', 'FINISHED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'CANCELLED', 'FINISHED'])
  status?: string;
}

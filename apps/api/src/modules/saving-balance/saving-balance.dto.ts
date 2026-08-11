import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SavingBalanceAccountDto {
  @ApiProperty({ example: 'Ahorro (Agora)' })
  @IsString()
  @IsNotEmpty()
  bucket!: string;

  @ApiPropertyOptional({ example: 'Agora' })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiProperty({ example: '3339.92' })
  @IsNumberString()
  amount!: string;
}

export class CreateSavingBalancePeriodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ type: [SavingBalanceAccountDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SavingBalanceAccountDto)
  accounts!: SavingBalanceAccountDto[];
}

export class UpsertSavingBalanceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 'Ahorro (Agora)' })
  @IsString()
  @IsNotEmpty()
  bucket!: string;

  @ApiPropertyOptional({ example: 'Agora' })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiProperty({ example: '3339.92' })
  @IsNumberString()
  amount!: string;
}

export class CreateSavingBucketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: 'Ahorro (BCP)' })
  @IsString()
  @IsNotEmpty()
  bucket!: string;

  @ApiPropertyOptional({ example: 'BCP' })
  @IsOptional()
  @IsString()
  bank?: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  amount?: string;
}

export class RenameSavingBucketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: 'Ahorro (Agora)' })
  @IsString()
  @IsNotEmpty()
  bucket!: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiProperty({ example: 'Ahorro Agora' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Agora' })
  @IsOptional()
  @IsString()
  bank?: string;
}

export class RemoveSavingBucketQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: 'Ahorro (Agora)' })
  @IsString()
  @IsNotEmpty()
  bucket!: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;
}

export class SavingBalanceQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;
}

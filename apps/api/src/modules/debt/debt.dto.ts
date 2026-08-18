import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

export class CreateDebtDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ enum: ['DEBO', 'ME_DEBEN'] })
  @IsIn(['DEBO', 'ME_DEBEN'])
  direction!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept!: string;

  @ApiProperty({ example: '3000.00' })
  @IsNumberString()
  originalAmount!: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ example: '0.05' })
  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  interestRate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDebtDto extends PartialType(CreateDebtDto) {}

export class AddDebtPaymentDto {
  @ApiProperty({ example: '500.00' })
  @IsNumberString()
  amount!: string;

  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

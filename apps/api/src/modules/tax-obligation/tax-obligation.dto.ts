import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Max, Min } from 'class-validator';

const TAX_STATUS = ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'];

export class CreateTaxObligationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: 'Renta Anual 2026' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiProperty({ example: '2027-06-30' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ example: '18726.00' })
  @IsOptional()
  @IsNumberString()
  amount?: string;

  @ApiPropertyOptional({ enum: TAX_STATUS, default: 'PENDING' })
  @IsOptional()
  @IsIn(TAX_STATUS)
  status?: string;

  @ApiPropertyOptional({ example: 12, description: 'Número de cuotas' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  installments?: number;

  @ApiPropertyOptional({ example: 3, description: 'Cuotas ya pagadas' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paidInstallments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTaxObligationDto extends PartialType(CreateTaxObligationDto) {}

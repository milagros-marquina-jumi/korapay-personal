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
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

const TAX_STATUS = ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED'];

/**
 * Una fila del cronograma de SUNAT. La amortizacion crece cada mes y el
 * interes baja, asi que no se puede derivar de una tasa: se copia del anexo.
 */
export class ScheduleRowDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  number!: number;

  @ApiPropertyOptional({ example: '2025-07-31' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: '1419.00', description: 'Amortización de capital' })
  @IsNumberString()
  principalAmount!: string;

  @ApiPropertyOptional({ example: '144.00', description: 'Interés de la cuota' })
  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  interestAmount?: string;
}

export class CreateTaxObligationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ example: 'Renta Anual 2026' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: '2027-06-30' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ example: '18726.00' })
  @IsOptional()
  @VacioComoNulo()
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

  @ApiPropertyOptional({
    description:
      'Cronograma tal como lo emite SUNAT: una fila por cuota con su amortización e interés. ' +
      'Reemplaza al cronograma generado automáticamente.',
    type: 'array',
    example: [{ number: 1, dueDate: '2025-07-31', principalAmount: '1419.00', interestAmount: '144.00' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleRowDto)
  schedule?: ScheduleRowDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTaxObligationDto extends PartialType(CreateTaxObligationDto) {}

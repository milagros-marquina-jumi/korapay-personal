import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

export class CreatePendingItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ enum: ['COBRAR', 'PAGAR'] })
  @IsIn(['COBRAR', 'PAGAR'])
  kind!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept!: string;

  @ApiProperty({ example: '250.00' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePendingItemDto extends PartialType(CreatePendingItemDto) {}

export class ListPendingItemsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ enum: ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE'] })
  @IsOptional()
  @IsIn(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE'])
  status?: string;
}

export class PayPendingItemDto {
  @ApiPropertyOptional({ example: '100.00', description: 'Monto del pago (parcial si es menor al total)' })
  @IsOptional()
  @IsNumberString()
  amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  date?: string;
}

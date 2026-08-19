import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Max, Min } from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

const TYPES = ['EGRESO', 'DEUDA'];

export class PortalListDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(TYPES)
  type?: string;

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

export class PortalCreateDto {
  @IsString()
  @IsNotEmpty()
  date!: string;

  @IsIn(TYPES)
  type!: string;

  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  paidAmount?: string;

  @IsOptional()
  @IsIn(['TALENT', 'MINE'])
  debtOwner?: string;

  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  debtAmount?: string;

  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  pendingAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;
}

export class PortalUpdateDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsIn(TYPES)
  type?: string;

  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  paidAmount?: string;

  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  debtAmount?: string;

  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  pendingAmount?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;
}

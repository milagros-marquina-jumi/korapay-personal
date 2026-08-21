import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

export class ListDetectedDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  emailSourceId?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateDetectedDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ConfirmDetectedDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  bank?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  amount?: string;

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  exchangeRate?: string;
}

export class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}

export class BulkConfirmDto {
  @IsArray()
  @Type(() => ConfirmItemDto)
  items!: ConfirmItemDto[];
}

export class ConfirmItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

export class CreateCompanyDto {
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
  @IsString()
  globalCompanyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ruc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  endDate?: string;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

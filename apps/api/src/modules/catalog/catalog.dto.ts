import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

export class CreateApplicationDto {
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
  provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;
}

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {}

export class CreateProjectDto {
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
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emoji?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class NamedCatalogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class CreateGlobalCompanyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ruc?: string;

  @ApiPropertyOptional({ description: 'Razon social segun SUNAT' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ example: 'https://empresa.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    description: 'Clientes globales que atiende esta empresa. Reemplaza la lista completa.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clientIds?: string[];

  @ApiPropertyOptional({
    description: 'Nombres de clientes nuevos a crear y asociar en el mismo guardado.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  newClientNames?: string[];
}

export class UpdateGlobalCompanyDto extends PartialType(CreateGlobalCompanyDto) {}

export class CreateGlobalClientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  globalCompanyId?: string;
}

export class UpdateGlobalClientDto extends PartialType(CreateGlobalClientDto) {}

export class CreateBankDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateBankDto extends PartialType(CreateBankDto) {}

export class CreateEmploymentContractDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '3500.00' })
  @IsOptional()
  @VacioComoNulo()
  @IsNumberString()
  salary?: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'] })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Clientes globales atendidos en este contrato. Reemplaza la lista completa.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clientIds?: string[];

  @ApiPropertyOptional({
    description: 'Clientes nuevos a crear en el catálogo global y asociar a la empresa del contrato.',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  newClientNames?: string[];
}

export class UpdateEmploymentContractDto extends PartialType(CreateEmploymentContractDto) {}

export class CreateCurrencyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}

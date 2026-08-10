import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreatePersonDto {
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
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ enum: ['TEAM', 'TALENT_REF'] })
  @IsOptional()
  @IsIn(['TEAM', 'TALENT_REF'])
  kind?: string;

  @ApiPropertyOptional({ example: '1200.00', description: 'Salario o tarifa de referencia' })
  @IsOptional()
  @IsNumberString()
  salary?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePersonDto extends PartialType(CreatePersonDto) {}

export class ListPeopleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ enum: ['TEAM', 'TALENT_REF'] })
  @IsOptional()
  @IsIn(['TEAM', 'TALENT_REF'])
  kind?: string;
}

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

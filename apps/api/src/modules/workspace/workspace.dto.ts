import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const WORKSPACE_TYPES = ['PERSONAL', 'EMPLOYMENT', 'BUSINESS', 'SHARED', 'SAVINGS', 'DEBTS'];

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @IsIn(WORKSPACE_TYPES)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsIn(WORKSPACE_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;
}

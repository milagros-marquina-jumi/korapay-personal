import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  targetWorkspaceId!: string;

  @IsOptional()
  @IsString()
  emailSourceId?: string;

  @IsOptional()
  @IsString()
  senderPattern?: string;

  @IsOptional()
  @IsString()
  subjectPattern?: string;

  @IsOptional()
  @IsString()
  merchantPattern?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  cardLast4?: string;

  @IsOptional()
  @IsString()
  targetAccountId?: string;

  @IsOptional()
  @IsString()
  targetCategoryId?: string;

  @IsOptional()
  @IsString()
  targetProjectId?: string;

  @IsOptional()
  @IsString()
  targetApplicationId?: string;

  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  merchantPattern?: string;

  @IsOptional()
  @IsString()
  senderPattern?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  cardLast4?: string;

  @IsOptional()
  @IsString()
  targetWorkspaceId?: string;

  @IsOptional()
  @IsString()
  targetAccountId?: string;

  @IsOptional()
  @IsString()
  targetCategoryId?: string;

  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

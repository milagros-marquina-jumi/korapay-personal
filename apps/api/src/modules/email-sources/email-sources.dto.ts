import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEmailSourceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  defaultWorkspaceId?: string;

  @IsOptional()
  @IsString()
  defaultAccountId?: string;
}

export class UpdateEmailSourceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  defaultWorkspaceId?: string;

  @IsOptional()
  @IsString()
  defaultAccountId?: string;
}

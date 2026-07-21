import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

const ACCOUNT_KINDS = ['SAVINGS', 'CHECKING', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET', 'CASH', 'PAYPAL', 'OTHER'];

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank!: string;

  @ApiPropertyOptional({ enum: ACCOUNT_KINDS, default: 'SAVINGS' })
  @IsOptional()
  @IsIn(ACCOUNT_KINDS)
  kind?: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ example: '1500.00' })
  @IsOptional()
  @IsNumberString()
  initialBalance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emoji?: string;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}

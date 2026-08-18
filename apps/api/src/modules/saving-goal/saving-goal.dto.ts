import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

export class CreateSavingGoalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '5000.00' })
  @IsNumberString()
  targetAmount!: string;

  @ApiPropertyOptional({ enum: ['PEN', 'USD'], default: 'PEN' })
  @IsOptional()
  @IsIn(['PEN', 'USD'])
  currency?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ example: '833.33' })
  @IsOptional()
  @IsNumberString()
  monthlyRecommend?: string;
}

export class UpdateSavingGoalDto extends PartialType(CreateSavingGoalDto) {}

export class AddSavingEntryDto {
  @ApiProperty({ example: '500.00' })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({ enum: ['CONTRIBUTION', 'WITHDRAWAL'], default: 'CONTRIBUTION' })
  @IsOptional()
  @IsIn(['CONTRIBUTION', 'WITHDRAWAL'])
  type?: string;

  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

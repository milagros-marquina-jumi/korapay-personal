import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VacioComoNulo } from '@/common/dto/empty-as-null.decorator';

export class DashboardQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @VacioComoNulo()
  @IsDateString()
  endDate?: string;
}

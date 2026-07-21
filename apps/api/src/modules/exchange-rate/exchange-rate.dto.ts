import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumberString } from 'class-validator';

export class UpsertExchangeRateDto {
  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '3.408' })
  @IsNumberString()
  rate!: string;
}

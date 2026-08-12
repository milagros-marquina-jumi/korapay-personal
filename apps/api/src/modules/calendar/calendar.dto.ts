import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export type CalendarSource = 'TRANSACTION' | 'TALENT_LEDGER' | 'TAX' | 'CONTRACT' | 'SUBSCRIPTION';
export type CalendarKind = 'PAYMENT' | 'COLLECTION' | 'CONTRACT_END';
export type CalendarStatus = 'PENDING' | 'REVIEW' | 'OVERDUE';

export class CalendarQueryDto {
  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from debe ser YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to debe ser YYYY-MM-DD' })
  to?: string;
}

export class CalendarEventDto {
  @ApiProperty() id!: string;
  @ApiProperty() source!: CalendarSource;
  @ApiProperty() kind!: CalendarKind;
  @ApiProperty() title!: string;
  @ApiProperty({ example: '2026-08-14' }) date!: string;
  @ApiProperty({ nullable: true }) amount!: string | null;
  @ApiProperty() currency!: string;
  @ApiProperty() workspaceId!: string;
  @ApiProperty() workspaceName!: string;
  @ApiProperty() status!: CalendarStatus;
  @ApiProperty() daysUntil!: number;
  @ApiProperty() href!: string;
}

export class CalendarSummaryDto {
  @ApiProperty() toPay!: string;
  @ApiProperty() toPayCount!: number;
  @ApiProperty() toCollect!: string;
  @ApiProperty() toCollectCount!: number;
  @ApiProperty() overdue!: string;
  @ApiProperty() overdueCount!: number;
  @ApiProperty() next30Count!: number;
}

export class CalendarResponseDto {
  @ApiProperty({ type: [CalendarEventDto] }) events!: CalendarEventDto[];
  @ApiProperty({ type: CalendarSummaryDto }) summary!: CalendarSummaryDto;
}

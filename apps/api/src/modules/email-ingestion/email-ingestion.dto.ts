import { IsDateString, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class IngestMessageDto {
  @IsIn(['GMAIL_APPS_SCRIPT'])
  provider!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  providerMessageId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  providerThreadId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  sourceEmail!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  sender!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  subject!: string;

  @IsDateString()
  receivedAt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  textBody!: string;
}

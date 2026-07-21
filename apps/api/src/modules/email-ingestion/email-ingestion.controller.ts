import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IngestMessageDto } from './email-ingestion.dto';
import { EmailIngestionService } from './email-ingestion.service';
import { IngestionGuard } from './ingestion.guard';

interface RequestWithSource {
  emailSource: {
    id: string;
    profileId: string;
    email: string;
    defaultWorkspaceId: string | null;
    defaultAccountId: string | null;
  };
}

@ApiTags('EmailIngestion')
@UseGuards(IngestionGuard)
@Controller('email-ingestion')
export class EmailIngestionController {
  constructor(private readonly service: EmailIngestionService) {}

  @Post('test')
  @HttpCode(200)
  @ApiOperation({ summary: 'Test ingestion token (no transaction created)' })
  test(@Req() req: RequestWithSource) {
    return { ok: true, emailSource: req.emailSource.email, message: 'Conexión correcta' };
  }

  @Post('messages')
  @HttpCode(200)
  @ApiOperation({ summary: 'Ingest a bank email (token auth)' })
  ingest(@Req() req: RequestWithSource, @Body() body: IngestMessageDto) {
    return this.service.ingest(req.emailSource, body);
  }
}

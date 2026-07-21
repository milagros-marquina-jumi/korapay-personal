import { Module } from '@nestjs/common';
import { EmailSourcesController } from './email-sources.controller';
import { EmailSourcesService } from './email-sources.service';

@Module({
  controllers: [EmailSourcesController],
  providers: [EmailSourcesService],
  exports: [EmailSourcesService],
})
export class EmailSourcesModule {}

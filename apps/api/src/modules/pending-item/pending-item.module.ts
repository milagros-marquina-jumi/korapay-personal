import { Module } from '@nestjs/common';
import { PendingItemController } from './pending-item.controller';
import { PendingItemService } from './pending-item.service';
@Module({
  controllers: [PendingItemController],
  providers: [PendingItemService],
  exports: [PendingItemService],
})
export class PendingItemModule {}

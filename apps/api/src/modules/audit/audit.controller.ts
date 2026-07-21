import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { AuditService } from './audit.service';
@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}
  @Get()
  @ApiOperation({ summary: 'Get audit logs' })
  findAll(
    @Query('workspaceId') workspaceId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.auditService.findAll(workspaceId, page, pageSize);
  }
}

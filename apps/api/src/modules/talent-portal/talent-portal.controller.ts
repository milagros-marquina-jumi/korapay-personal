import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortalCreateDto, PortalListDto, PortalUpdateDto } from './talent-portal.dto';
import { TalentPortalService } from './talent-portal.service';

@ApiTags('TalentPortal')
@Controller('portal')
export class TalentPortalController {
  constructor(private readonly service: TalentPortalService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Talent portal profile + summary (public, token)' })
  profile(@Param('token') token: string) {
    return this.service.profile(token);
  }

  @Get(':token/ledger')
  @ApiOperation({ summary: 'Talent own ledger (public, token)' })
  ledger(@Param('token') token: string, @Query() filters: PortalListDto) {
    return this.service.ledgerList(token, filters);
  }

  @Post(':token/ledger')
  @ApiOperation({ summary: 'Talent creates own ledger entry (public, token)' })
  create(@Param('token') token: string, @Body() body: PortalCreateDto) {
    return this.service.create(token, body);
  }

  @Patch(':token/ledger/:id')
  @ApiOperation({ summary: 'Talent edits own ledger entry (public, token)' })
  update(@Param('token') token: string, @Param('id') id: string, @Body() body: PortalUpdateDto) {
    return this.service.update(token, id, body);
  }
}

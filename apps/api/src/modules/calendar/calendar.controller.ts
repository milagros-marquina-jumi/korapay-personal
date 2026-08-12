import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { CalendarQueryDto } from './calendar.dto';
import { CalendarService } from './calendar.service';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Eventos financieros de todos los workspaces del usuario' })
  getEvents(@CurrentUser('sub') profileId: string, @Query() { from, to }: CalendarQueryDto) {
    return this.calendarService.getEvents(profileId, from, to);
  }
}

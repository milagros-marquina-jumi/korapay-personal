import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/common/auth/auth.guard';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { UpdateProfileDto } from './profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current profile' })
  me(@CurrentUser('sub') userId: string) {
    return this.profileService.getById(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current profile' })
  update(@CurrentUser('sub') userId: string, @Body() body: UpdateProfileDto) {
    return this.profileService.update(userId, body);
  }
}

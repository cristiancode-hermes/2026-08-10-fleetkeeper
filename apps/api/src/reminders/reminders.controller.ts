import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { RemindersService } from './reminders.service';

@ApiTags('reminders')
@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RemindersController {
  constructor(private remindersService: RemindersService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type?: string,
    @Query('acknowledged') acknowledged?: string,
  ) {
    return this.remindersService.findAll(user.id, { type, acknowledged });
  }

  @Patch(':id/ack')
  acknowledge(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.remindersService.acknowledge(user.id, id);
  }
}

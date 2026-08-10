import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('costs')
  costs(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.reportsService.costs(user.id, { from, to, vehicleId });
  }

  @Get('efficiency')
  efficiency(
    @CurrentUser() user: AuthenticatedUser,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.reportsService.efficiency(user.id, vehicleId);
  }
}

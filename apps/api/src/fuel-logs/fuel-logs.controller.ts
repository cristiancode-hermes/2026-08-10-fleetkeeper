import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { FuelLogsService } from './fuel-logs.service';
import { CreateFuelLogDto, UpdateFuelLogDto } from './dto/fuel-log.dto';

@ApiTags('fuel-logs')
@Controller('fuel-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FuelLogsController {
  constructor(private fuelLogsService: FuelLogsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('vehicleId') vehicleId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.fuelLogsService.findAll(user.id, { vehicleId, from, to });
  }

  // ⚠️ ANTES de @Get(':id')
  @Get('export')
  async exportCsv(@CurrentUser() user: AuthenticatedUser, @Request() req: Request) {
    const { filename, csv } = await this.fuelLogsService.exportCsv(user.id);
    const res: any = (req as any).res;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFuelLogDto) {
    return this.fuelLogsService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.fuelLogsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFuelLogDto,
  ) {
    return this.fuelLogsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.fuelLogsService.remove(user.id, id);
  }
}

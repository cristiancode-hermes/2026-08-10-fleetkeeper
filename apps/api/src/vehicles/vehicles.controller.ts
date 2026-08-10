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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@ApiTags('vehicles')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.vehiclesService.findAll(user.id, {
      search,
      status,
      category,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ⚠️ ANTES de @Get(':id') — rutas fijas primero
  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.dashboard(user.id);
  }

  @Get('export')
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Request() req: Request,
  ) {
    const { filename, csv } = await this.vehiclesService.exportCsv(user.id);
    const res: any = (req as any).res;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(csv);
  }

  @Get(':id/summary')
  summary(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vehiclesService.summary(user.id, id);
  }

  @Post()
  @Roles('admin', 'manager')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vehiclesService.findOne(user.id, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.vehiclesService.remove(user.id, id);
  }
}

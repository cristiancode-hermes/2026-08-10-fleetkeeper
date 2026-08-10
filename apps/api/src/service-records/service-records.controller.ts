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
import { ServiceRecordsService } from './service-records.service';
import {
  CreateServiceRecordDto,
  UpdateServiceRecordDto,
} from './dto/service-record.dto';

@ApiTags('service-records')
@Controller('service-records')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceRecordsController {
  constructor(private serviceRecordsService: ServiceRecordsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.serviceRecordsService.findAll(user.id, vehicleId);
  }

  // ⚠️ ANTES de @Get(':id')
  @Get('export')
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Request() req: Request,
  ) {
    const { filename, csv } = await this.serviceRecordsService.exportCsv(user.id);
    const res: any = (req as any).res;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Post()
  @Roles('admin', 'manager')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateServiceRecordDto) {
    return this.serviceRecordsService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.serviceRecordsService.findOne(user.id, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateServiceRecordDto,
  ) {
    return this.serviceRecordsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.serviceRecordsService.remove(user.id, id);
  }
}

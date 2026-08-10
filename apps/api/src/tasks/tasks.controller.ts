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
import { TasksService } from './tasks.service';
import {
  CompleteTaskDto,
  CreateTaskDto,
  UpdateTaskDto,
} from './dto/task.dto';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.tasksService.findAll(user.id, { vehicleId, status, type });
  }

  @Post()
  @Roles('admin', 'manager')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto & { vehicleId: string },
  ) {
    return this.tasksService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tasksService.findOne(user.id, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Patch(':id/complete')
  @Roles('admin', 'manager')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
  ) {
    return this.tasksService.complete(user.id, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tasksService.remove(user.id, id);
  }
}

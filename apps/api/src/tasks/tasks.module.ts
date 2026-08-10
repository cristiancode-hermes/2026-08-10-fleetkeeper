import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuthModule } from '../auth/auth.module';
import { MaintenanceTask } from '../entities/maintenance-task.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { Reminder } from '../entities/reminder.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceTask, Vehicle, ServiceRecord, Reminder]),
    AuthModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

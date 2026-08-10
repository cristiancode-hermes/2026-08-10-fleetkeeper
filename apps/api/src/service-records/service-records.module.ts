import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRecordsController } from './service-records.controller';
import { ServiceRecordsService } from './service-records.service';
import { AuthModule } from '../auth/auth.module';
import { ServiceRecord } from '../entities/service-record.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { MaintenanceTask } from '../entities/maintenance-task.entity';
import { Reminder } from '../entities/reminder.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRecord, Vehicle, MaintenanceTask, Reminder]),
    AuthModule,
  ],
  controllers: [ServiceRecordsController],
  providers: [ServiceRecordsService],
  exports: [ServiceRecordsService],
})
export class ServiceRecordsModule {}

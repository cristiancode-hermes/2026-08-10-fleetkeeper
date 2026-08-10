import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { AuthModule } from '../auth/auth.module';
import { Vehicle } from '../entities/vehicle.entity';
import { MaintenanceTask } from '../entities/maintenance-task.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { FuelLog } from '../entities/fuel-log.entity';
import { Reminder } from '../entities/reminder.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
      MaintenanceTask,
      ServiceRecord,
      FuelLog,
      Reminder,
    ]),
    AuthModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}

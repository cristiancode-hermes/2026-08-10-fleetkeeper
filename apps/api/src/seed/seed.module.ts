import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { MaintenanceTask } from '../entities/maintenance-task.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { FuelLog } from '../entities/fuel-log.entity';
import { Reminder } from '../entities/reminder.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Vehicle,
      MaintenanceTask,
      ServiceRecord,
      FuelLog,
      Reminder,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

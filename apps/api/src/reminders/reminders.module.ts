import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { AuthModule } from '../auth/auth.module';
import { Reminder } from '../entities/reminder.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { MaintenanceTask } from '../entities/maintenance-task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reminder, Vehicle, MaintenanceTask]),
    AuthModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}

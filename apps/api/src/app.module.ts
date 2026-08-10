import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TasksModule } from './tasks/tasks.module';
import { ServiceRecordsModule } from './service-records/service-records.module';
import { FuelLogsModule } from './fuel-logs/fuel-logs.module';
import { RemindersModule } from './reminders/reminders.module';
import { ReportsModule } from './reports/reports.module';
import { SeedModule } from './seed/seed.module';
import { User } from './entities/user.entity';
import { Vehicle } from './entities/vehicle.entity';
import { MaintenanceTask } from './entities/maintenance-task.entity';
import { ServiceRecord } from './entities/service-record.entity';
import { FuelLog } from './entities/fuel-log.entity';
import { Reminder } from './entities/reminder.entity';

const dbType = process.env.DATABASE_TYPE || 'better-sqlite3';

const entities = [
  User,
  Vehicle,
  MaintenanceTask,
  ServiceRecord,
  FuelLog,
  Reminder,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(
      dbType === 'postgres'
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            entities,
            synchronize: true,
          }
        : {
            type: 'better-sqlite3' as const,
            database: process.env.DATABASE_URL || 'data/fleetkeeper.db',
            entities,
            synchronize: true,
          },
    ),
    AuthModule,
    UsersModule,
    VehiclesModule,
    TasksModule,
    ServiceRecordsModule,
    FuelLogsModule,
    RemindersModule,
    ReportsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}

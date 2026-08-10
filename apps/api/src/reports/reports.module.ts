import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AuthModule } from '../auth/auth.module';
import { Vehicle } from '../entities/vehicle.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { FuelLog } from '../entities/fuel-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, ServiceRecord, FuelLog]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}

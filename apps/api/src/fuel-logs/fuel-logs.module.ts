import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelLogsController } from './fuel-logs.controller';
import { FuelLogsService } from './fuel-logs.service';
import { AuthModule } from '../auth/auth.module';
import { FuelLog } from '../entities/fuel-log.entity';
import { Vehicle } from '../entities/vehicle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FuelLog, Vehicle]), AuthModule],
  controllers: [FuelLogsController],
  providers: [FuelLogsService],
  exports: [FuelLogsService],
})
export class FuelLogsModule {}

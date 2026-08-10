import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TaskType } from '../../entities/maintenance-task.entity';

export const TASK_TYPES = ['oil', 'brakes', 'tires', 'itv', 'inspection', 'filter', 'other'];

export class CreateTaskDto {
  @ApiProperty({ example: 'uuid-del-vehiculo' })
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: 'Cambio de aceite' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: TASK_TYPES })
  @IsIn(TASK_TYPES)
  type: TaskType;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalKm?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMonths?: number;

  @ApiPropertyOptional({ description: 'Fecha última ejecución ISO' })
  @IsOptional()
  @IsString()
  lastDoneAt?: string;

  @ApiPropertyOptional({ example: 85200 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lastOdometerKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ enum: TASK_TYPES })
  @IsOptional()
  @IsIn(TASK_TYPES)
  type?: TaskType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastDoneAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  lastOdometerKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteTaskDto {
  @ApiProperty({ example: '2026-08-12' })
  @IsString()
  date: string;

  @ApiProperty({ example: 87430 })
  @IsInt()
  @Min(0)
  odometer: number;

  @ApiPropertyOptional({ example: 180.5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 'Taller Hermanos Ruiz' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  vendor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

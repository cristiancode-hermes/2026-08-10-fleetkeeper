import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { VehicleCategory, VehicleFuelType, VehicleStatus } from '../../entities/vehicle.entity';

export const VEHICLE_CATEGORIES = ['car', 'van', 'truck', 'motorcycle', 'other'];
export const VEHICLE_FUEL_TYPES = ['diesel', 'petrol', 'electric', 'hybrid', 'lpg'];
export const VEHICLE_STATUSES = ['active', 'maintenance', 'retired'];

export class CreateVehicleDto {
  @ApiProperty({ example: '2341-FGH' })
  @IsString()
  @Matches(/^[A-Za-z0-9-]{2,15}$/, {
    message: 'Matrícula inválida: solo letras, números y guiones (2-15)',
  })
  plate: string;

  @ApiProperty({ example: 'Renault' })
  @IsString()
  @MaxLength(60)
  make: string;

  @ApiProperty({ example: 'Kangoo' })
  @IsString()
  @MaxLength(60)
  model: string;

  @ApiProperty({ example: 2019 })
  @IsInt()
  @Min(1950)
  year: number;

  @ApiProperty({ enum: VEHICLE_CATEGORIES })
  @IsIn(VEHICLE_CATEGORIES)
  category: VehicleCategory;

  @ApiProperty({ enum: VEHICLE_FUEL_TYPES })
  @IsIn(VEHICLE_FUEL_TYPES)
  fuelType: VehicleFuelType;

  @ApiPropertyOptional({ example: 87430 })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentOdometer?: number;

  @ApiPropertyOptional({ example: { trailer: true } })
  @IsOptional()
  @IsObject()
  specs?: Record<string, unknown>;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: '2341-FGH' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{2,15}$/, {
    message: 'Matrícula inválida: solo letras, números y guiones (2-15)',
  })
  plate?: string;

  @ApiPropertyOptional({ example: 'Renault' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  make?: string;

  @ApiPropertyOptional({ example: 'Kangoo' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  model?: string;

  @ApiPropertyOptional({ example: 2019 })
  @IsOptional()
  @IsInt()
  @Min(1950)
  year?: number;

  @ApiPropertyOptional({ enum: VEHICLE_CATEGORIES })
  @IsOptional()
  @IsIn(VEHICLE_CATEGORIES)
  category?: VehicleCategory;

  @ApiPropertyOptional({ enum: VEHICLE_FUEL_TYPES })
  @IsOptional()
  @IsIn(VEHICLE_FUEL_TYPES)
  fuelType?: VehicleFuelType;

  @ApiPropertyOptional({ example: 87430 })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentOdometer?: number;

  @ApiPropertyOptional({ enum: VEHICLE_STATUSES })
  @IsOptional()
  @IsIn(VEHICLE_STATUSES)
  status?: VehicleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  specs?: Record<string, unknown>;
}

import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFuelLogDto {
  @ApiProperty({ example: 'uuid-del-vehiculo' })
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: '2026-08-10' })
  @IsString()
  date: string;

  @ApiProperty({ example: 87430 })
  @IsInt()
  @Min(0)
  odometer: number;

  @ApiProperty({ example: 42.5 })
  @IsNumber()
  @Min(0)
  liters: number;

  @ApiProperty({ example: 74.2 })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  fullTank?: boolean;
}

export class UpdateFuelLogDto {
  @ApiPropertyOptional({ example: '2026-08-10' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 88000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometer?: number;

  @ApiPropertyOptional({ example: 43 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  liters?: number;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  fullTank?: boolean;
}

export const REMINDER_TYPES = ['due', 'overdue'] as const;
export type ReminderTypeQuery = (typeof REMINDER_TYPES)[number];

import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceRecordDto {
  @ApiProperty({ example: 'uuid-del-vehiculo' })
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional({ example: 'uuid-de-la-tarea' })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiProperty({ example: '2026-08-12' })
  @IsString()
  date: string;

  @ApiProperty({ example: 87430 })
  @IsInt()
  @Min(0)
  odometer: number;

  @ApiPropertyOptional({ example: 180.5 })
  @IsOptional()
  @IsNumber()
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

export class UpdateServiceRecordDto {
  @ApiPropertyOptional({ example: '2026-08-12' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 88000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometer?: number;

  @ApiPropertyOptional({ example: 190 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  vendor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

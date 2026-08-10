import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type VehicleCategory = 'car' | 'van' | 'truck' | 'motorcycle' | 'other';
export type VehicleFuelType = 'diesel' | 'petrol' | 'electric' | 'hybrid' | 'lpg';
export type VehicleStatus = 'active' | 'maintenance' | 'retired';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ unique: true, length: 15 })
  plate: string;

  @Column({ length: 60 })
  make: string;

  @Column({ length: 60 })
  model: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ length: 20 })
  category: VehicleCategory;

  @Column({ name: 'fuel_type', length: 20 })
  fuelType: VehicleFuelType;

  @Column({ name: 'current_odometer', type: 'int', default: 0 })
  currentOdometer: number;

  @Column({ length: 20, default: 'active' })
  status: VehicleStatus;

  @Column({ type: 'simple-json', nullable: true })
  specs: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}

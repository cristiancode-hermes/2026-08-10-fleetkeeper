import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

const decimalTransformer = {
  to: (v: number | null | undefined) => v ?? 0,
  from: (v: string | number | null | undefined) =>
    v == null ? 0 : Number(v),
};

@Entity('fuel_logs')
export class FuelLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int' })
  odometer: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    transformer: decimalTransformer,
  })
  liters: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  cost: number;

  @Column({ name: 'full_tank', default: true })
  fullTank: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}

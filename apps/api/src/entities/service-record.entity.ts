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

@Entity('service_records')
export class ServiceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ name: 'task_id', type: 'text', nullable: true })
  taskId: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int' })
  odometer: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  cost: number;

  @Column({ type: 'text', length: 120, nullable: true })
  vendor: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type ReminderType = 'due' | 'overdue';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @Column({ name: 'due_date', type: 'datetime' })
  dueDate: Date;

  @Column({ length: 20 })
  type: ReminderType;

  @Column({ name: 'acknowledged_at', type: 'datetime', nullable: true })
  acknowledgedAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}

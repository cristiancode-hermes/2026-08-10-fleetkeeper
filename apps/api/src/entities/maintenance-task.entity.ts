import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type TaskType =
  | 'oil'
  | 'brakes'
  | 'tires'
  | 'itv'
  | 'inspection'
  | 'filter'
  | 'other';

export type TaskStatus = 'upcoming' | 'due' | 'overdue' | 'done';

@Entity('maintenance_tasks')
export class MaintenanceTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 40 })
  type: TaskType;

  @Column({ name: 'interval_km', type: 'int', nullable: true })
  intervalKm: number | null;

  @Column({ name: 'interval_months', type: 'int', nullable: true })
  intervalMonths: number | null;

  @Column({ name: 'last_done_at', type: 'datetime', nullable: true })
  lastDoneAt: Date | null;

  @Column({ name: 'last_odometer_km', type: 'int', nullable: true })
  lastOdometerKm: number | null;

  @Column({ name: 'next_due_km', type: 'int', nullable: true })
  nextDueKm: number | null;

  @Column({ name: 'next_due_date', type: 'datetime', nullable: true })
  nextDueDate: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}

/**
 * Calcula nextDueKm/nextDueDate a partir de la última ejecución y los intervalos.
 * Regla: cuando ambos intervalos existen, vence cuando se alcance EL PRIMERO.
 */
export function computeNextDue(
  task: Pick<
    MaintenanceTask,
    'intervalKm' | 'intervalMonths' | 'lastDoneAt' | 'lastOdometerKm'
  >,
): Pick<MaintenanceTask, 'nextDueKm' | 'nextDueDate'> {
  const nextDueKm =
    task.intervalKm != null && task.lastOdometerKm != null
      ? task.lastOdometerKm + task.intervalKm
      : null;
  const nextDueDate =
    task.intervalMonths != null && task.lastDoneAt != null
      ? addMonths(new Date(task.lastDoneAt), task.intervalMonths)
      : null;
  return { nextDueKm, nextDueDate };
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Estado derivado de una tarea — NUNCA se persiste como columna.
 * - overdue: vencida por km o por fecha
 * - done: completada hace ≤30 días (y no vencida)
 * - due: vence en ≤30 días o ≤2.000 km
 * - upcoming: resto
 */
export function computeTaskStatus(
  task: Pick<
    MaintenanceTask,
    'nextDueKm' | 'nextDueDate' | 'lastDoneAt'
  >,
  currentOdometer: number,
  now: Date = new Date(),
): TaskStatus {
  const isOverdue =
    (task.nextDueDate != null && new Date(task.nextDueDate) < now) ||
    (task.nextDueKm != null && task.nextDueKm <= currentOdometer);
  if (isOverdue) return 'overdue';

  const doneRecently =
    task.lastDoneAt != null &&
    now.getTime() - new Date(task.lastDoneAt).getTime() <= 30 * 24 * 3600 * 1000;
  if (doneRecently) return 'done';

  const dueWindow = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const isDue =
    (task.nextDueDate != null && new Date(task.nextDueDate) <= dueWindow) ||
    (task.nextDueKm != null && task.nextDueKm <= currentOdometer + 2000);
  return isDue ? 'due' : 'upcoming';
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Reminder } from '../entities/reminder.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { MaintenanceTask } from '../entities/maintenance-task.entity';

export interface ReminderWithDetails extends Reminder {
  taskName?: string;
  plate?: string;
}

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private reminderRepository: Repository<Reminder>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(MaintenanceTask)
    private taskRepository: Repository<MaintenanceTask>,
  ) {}

  async findAll(
    userId: string,
    query: { type?: string; acknowledged?: string },
  ): Promise<ReminderWithDetails[]> {
    const where: Record<string, unknown> = { userId };
    if (query.type === 'due' || query.type === 'overdue') {
      where.type = query.type;
    }
    if (query.acknowledged === 'true') {
      // acked: acknowledgedAt NOT NULL
      const rows = await this.reminderRepository.find({ where });
      const withDetails = await this.decorate(userId, rows);
      return withDetails.filter((r) => r.acknowledgedAt != null);
    }
    if (query.acknowledged === 'false') {
      where.acknowledgedAt = IsNull();
    }
    const rows = await this.reminderRepository.find({
      where,
      order: { dueDate: 'ASC' },
    });
    return this.decorate(userId, rows);
  }

  async acknowledge(userId: string, id: string): Promise<ReminderWithDetails> {
    const reminder = await this.reminderRepository.findOne({ where: { id } });
    if (!reminder || reminder.userId !== userId) {
      throw new NotFoundException('Recordatorio no encontrado');
    }
    reminder.acknowledgedAt = new Date();
    const saved = (await this.reminderRepository.save(
      reminder as any,
    )) as unknown as Reminder;
    return (await this.decorate(userId, [saved]))[0];
  }

  private async decorate(
    userId: string,
    reminders: Reminder[],
  ): Promise<ReminderWithDetails[]> {
    if (reminders.length === 0) return [];
    const vehicleIds = [...new Set(reminders.map((r) => r.vehicleId))];
    const taskIds = [...new Set(reminders.map((r) => r.taskId))];
    const [vehicles, tasks] = await Promise.all([
      this.vehicleRepository.find({ where: { id: In(vehicleIds) } }),
      this.taskRepository.find({ where: { id: In(taskIds) } }),
    ]);
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    return reminders.map((r) => ({
      ...r,
      taskName: taskById.get(r.taskId)?.name,
      plate: vehicleById.get(r.vehicleId)?.plate,
    }));
  }
}

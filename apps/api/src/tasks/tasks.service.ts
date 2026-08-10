import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MaintenanceTask, computeNextDue, computeTaskStatus } from '../entities/maintenance-task.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { Reminder } from '../entities/reminder.entity';
import {
  CompleteTaskDto,
  CreateTaskDto,
  UpdateTaskDto,
} from './dto/task.dto';

export interface TaskWithStatus extends MaintenanceTask {
  status: string;
  plate?: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(MaintenanceTask)
    private taskRepository: Repository<MaintenanceTask>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(ServiceRecord)
    private serviceRepository: Repository<ServiceRecord>,
    @InjectRepository(Reminder)
    private reminderRepository: Repository<Reminder>,
  ) {}

  async findAll(
    userId: string,
    query: { vehicleId?: string; status?: string; type?: string },
  ): Promise<TaskWithStatus[]> {
    const vehicles = await this.vehicleRepository.find({ where: { userId } });
    const vehicleIds = vehicles.map((v) => v.id);
    if (vehicleIds.length === 0) return [];
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

    const where: Record<string, unknown> = {};
    if (query.vehicleId) {
      if (!vehicleById.has(query.vehicleId)) return [];
      where.vehicleId = query.vehicleId;
    } else {
      where.vehicleId = In(vehicleIds);
    }
    if (query.type) where.type = query.type;

    const tasks = await this.taskRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });
    const result = tasks.map((t) => {
      const vehicle = vehicleById.get(t.vehicleId);
      return {
        ...t,
        status: computeTaskStatus(t, vehicle?.currentOdometer ?? 0),
        plate: vehicle?.plate ?? '',
      };
    });
    if (query.status) {
      return result.filter((t) => t.status === query.status);
    }
    return result;
  }

  async findOne(userId: string, id: string): Promise<TaskWithStatus> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: task.vehicleId, userId },
    });
    if (!vehicle) throw new NotFoundException('Tarea no encontrada');
    return {
      ...task,
      status: computeTaskStatus(task, vehicle.currentOdometer),
      plate: vehicle.plate,
    };
  }

  async create(userId: string, dto: CreateTaskDto): Promise<TaskWithStatus> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: dto.vehicleId, userId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    this.assertInterval(dto.intervalKm, dto.intervalMonths);

    const task = this.taskRepository.create({
      vehicleId: vehicle.id,
      name: dto.name,
      type: dto.type,
      intervalKm: dto.intervalKm ?? null,
      intervalMonths: dto.intervalMonths ?? null,
      lastDoneAt: dto.lastDoneAt ? new Date(dto.lastDoneAt) : null,
      lastOdometerKm: dto.lastOdometerKm ?? null,
      notes: dto.notes ?? null,
    } as any) as unknown as MaintenanceTask;

    const next = computeNextDue(task);
    task.nextDueKm = next.nextDueKm;
    task.nextDueDate = next.nextDueDate;

    const saved = (await this.taskRepository.save(
      task as any,
    )) as unknown as MaintenanceTask;
    return {
      ...saved,
      status: computeTaskStatus(saved, vehicle.currentOdometer),
      plate: vehicle.plate,
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTaskDto,
  ): Promise<TaskWithStatus> {
    const existing = await this.findOne(userId, id);
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Tarea no encontrada');

    if (dto.name !== undefined) task.name = dto.name;
    if (dto.type !== undefined) task.type = dto.type;
    if (dto.intervalKm !== undefined) task.intervalKm = dto.intervalKm;
    if (dto.intervalMonths !== undefined) task.intervalMonths = dto.intervalMonths;
    if (dto.lastDoneAt !== undefined) {
      task.lastDoneAt = dto.lastDoneAt ? new Date(dto.lastDoneAt) : null;
    }
    if (dto.lastOdometerKm !== undefined) task.lastOdometerKm = dto.lastOdometerKm;
    if (dto.notes !== undefined) task.notes = dto.notes;

    this.assertInterval(task.intervalKm, task.intervalMonths);
    const next = computeNextDue(task);
    task.nextDueKm = next.nextDueKm;
    task.nextDueDate = next.nextDueDate;

    const saved = (await this.taskRepository.save(
      task as any,
    )) as unknown as MaintenanceTask;
    return {
      ...saved,
      status: existing.status,
      plate: existing.plate,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.taskRepository.delete({ id });
  }

  /**
   * Completa una tarea: crea ServiceRecord, actualiza última ejecución y
   * vencimientos, sube el odómetro del vehículo y acusa los reminders.
   */
  async complete(
    userId: string,
    id: string,
    dto: CompleteTaskDto,
  ): Promise<{ task: TaskWithStatus; serviceRecord: ServiceRecord }> {
    const existing = await this.findOne(userId, id);
    const task = await this.taskRepository.findOne({ where: { id } });
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: task!.vehicleId, userId },
    });
    if (!task || !vehicle) throw new NotFoundException('Tarea no encontrada');

    if (dto.odometer < vehicle.currentOdometer) {
      throw new UnprocessableEntityException(
        `El odómetro no puede ser menor al último registrado (${vehicle.currentOdometer} km)`,
      );
    }

    const date = dto.date;
    const serviceRecord = this.serviceRepository.create({
      vehicleId: vehicle.id,
      taskId: task.id,
      date,
      odometer: dto.odometer,
      cost: dto.cost ?? 0,
      vendor: dto.vendor ?? null,
      notes: dto.notes ?? null,
    } as any);
    const savedRecord = (await this.serviceRepository.save(serviceRecord)) as unknown as ServiceRecord;

    // Actualizar tarea
    task.lastDoneAt = new Date(`${date}T12:00:00`);
    task.lastOdometerKm = dto.odometer;
    const next = computeNextDue(task);
    task.nextDueKm = next.nextDueKm;
    task.nextDueDate = next.nextDueDate;
    const savedTask = (await this.taskRepository.save(
      task as any,
    )) as unknown as MaintenanceTask;

    // Subir odómetro del vehículo
    if (dto.odometer > vehicle.currentOdometer) {
      vehicle.currentOdometer = dto.odometer;
      await this.vehicleRepository.save(vehicle);
    }

    // Acusar reminders pendientes de esta tarea
    await this.reminderRepository.update(
      { taskId: task.id },
      { acknowledgedAt: new Date() },
    );

    const vehicleAfter = vehicle.currentOdometer;
    return {
      task: {
        ...savedTask,
        status: computeTaskStatus(savedTask, vehicleAfter),
        plate: vehicle.plate,
      },
      serviceRecord: savedRecord,
    };
  }

  async acknowledgeTaskReminders(taskId: string): Promise<void> {
    await this.reminderRepository.update(
      { taskId },
      { acknowledgedAt: new Date() },
    );
  }

  private assertInterval(
    intervalKm?: number | null,
    intervalMonths?: number | null,
  ): void {
    if ((intervalKm == null || intervalKm === undefined) && (intervalMonths == null || intervalMonths === undefined)) {
      throw new UnprocessableEntityException('Indica al menos un intervalo (km o meses)');
    }
  }
}

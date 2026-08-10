import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRecord } from '../entities/service-record.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { MaintenanceTask, computeNextDue } from '../entities/maintenance-task.entity';
import { Reminder } from '../entities/reminder.entity';
import {
  CreateServiceRecordDto,
  UpdateServiceRecordDto,
} from './dto/service-record.dto';

@Injectable()
export class ServiceRecordsService {
  constructor(
    @InjectRepository(ServiceRecord)
    private serviceRepository: Repository<ServiceRecord>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(MaintenanceTask)
    private taskRepository: Repository<MaintenanceTask>,
    @InjectRepository(Reminder)
    private reminderRepository: Repository<Reminder>,
  ) {}

  private async assertVehicle(userId: string, vehicleId: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId, userId },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }

  async findAll(userId: string, vehicleId?: string): Promise<ServiceRecord[]> {
    const vehicles = await this.vehicleRepository.find({ where: { userId } });
    const ids = new Set(vehicles.map((v) => v.id));
    if (vehicleId) {
      if (!ids.has(vehicleId)) return [];
      return this.serviceRepository.find({
        where: { vehicleId },
        order: { date: 'DESC', createdAt: 'DESC' },
      });
    }
    const all = await this.serviceRepository.find({
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return all.filter((s) => ids.has(s.vehicleId));
  }

  async create(userId: string, dto: CreateServiceRecordDto) {
    const vehicle = await this.assertVehicle(userId, dto.vehicleId);

    if (dto.odometer < vehicle.currentOdometer) {
      throw new UnprocessableEntityException(
        `El odómetro no puede ser menor al último registrado (${vehicle.currentOdometer} km)`,
      );
    }

    let task: MaintenanceTask | null = null;
    if (dto.taskId) {
      task = await this.taskRepository.findOne({
        where: { id: dto.taskId, vehicleId: vehicle.id },
      });
      if (!task) throw new NotFoundException('Tarea no encontrada para ese vehículo');
    }

    const record = this.serviceRepository.create({
      vehicleId: vehicle.id,
      taskId: task?.id ?? null,
      date: dto.date,
      odometer: dto.odometer,
      cost: dto.cost ?? 0,
      vendor: dto.vendor ?? null,
      notes: dto.notes ?? null,
    } as any);
    const saved = (await this.serviceRepository.save(record)) as unknown as ServiceRecord;

    if (task) {
      task.lastDoneAt = new Date(`${dto.date}T12:00:00`);
      task.lastOdometerKm = dto.odometer;
      const next = computeNextDue(task);
      task.nextDueKm = next.nextDueKm;
      task.nextDueDate = next.nextDueDate;
      await this.taskRepository.save(task as any);
      await this.reminderRepository.update(
        { taskId: task.id },
        { acknowledgedAt: new Date() },
      );
    }

    if (dto.odometer > vehicle.currentOdometer) {
      vehicle.currentOdometer = dto.odometer;
      await this.vehicleRepository.save(vehicle as any);
    }

    return saved;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateServiceRecordDto,
  ): Promise<ServiceRecord> {
    const record = await this.findOne(userId, id);
    if (dto.date !== undefined) record.date = dto.date;
    if (dto.odometer !== undefined) record.odometer = dto.odometer;
    if (dto.cost !== undefined) record.cost = dto.cost;
    if (dto.vendor !== undefined) record.vendor = dto.vendor;
    if (dto.notes !== undefined) record.notes = dto.notes;
    return (await this.serviceRepository.save(record as any)) as unknown as ServiceRecord;
  }

  async findOne(userId: string, id: string): Promise<ServiceRecord> {
    const record = await this.serviceRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Servicio no encontrado');
    await this.assertVehicle(userId, record.vehicleId);
    return record;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.serviceRepository.delete({ id });
  }

  async exportCsv(userId: string): Promise<{ filename: string; csv: string }> {
    const records = await this.findAll(userId);
    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['fecha', 'odometro', 'coste', 'taller', 'notas', 'vehiculo_id', 'tarea_id'];
    const rows = records.map((r) => [
      r.date,
      r.odometer,
      Number(r.cost).toFixed(2),
      r.vendor ?? '',
      r.notes ?? '',
      r.vehicleId,
      r.taskId ?? '',
    ]);
    return {
      filename: `servicios-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: [header, ...rows].map((r) => r.map(escape).join(',')).join('\n'),
    };
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import { MaintenanceTask } from '../entities/maintenance-task.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { FuelLog } from '../entities/fuel-log.entity';
import { Reminder } from '../entities/reminder.entity';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';
import { computeTaskStatus } from '../entities/maintenance-task.entity';

export interface VehicleListItem extends Vehicle {
  costTotal: number;
}

export interface DashboardPayload {
  kpis: { active: number; maintenance: number; retired: number };
  alerts: Array<{
    id: string;
    taskId: string;
    vehicleId: string;
    type: string;
    dueDate: Date;
    taskName: string;
    plate: string;
    acknowledgedAt: Date | null;
  }>;
  monthlyCost: { fuel: number; service: number; total: number };
}

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(MaintenanceTask)
    private taskRepository: Repository<MaintenanceTask>,
    @InjectRepository(ServiceRecord)
    private serviceRepository: Repository<ServiceRecord>,
    @InjectRepository(FuelLog)
    private fuelRepository: Repository<FuelLog>,
    @InjectRepository(Reminder)
    private reminderRepository: Repository<Reminder>,
  ) {}

  private normalizePlate(plate: string): string {
    return plate.trim().toUpperCase().replace(/\s+/g, '-');
  }

  async findAll(
    userId: string,
    query: {
      search?: string;
      status?: string;
      category?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ items: VehicleListItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const qb = this.vehicleRepository.createQueryBuilder('v');
    qb.where('v.user_id = :userId', { userId });

    if (query.search) {
      const like = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(v.plate) LIKE :like OR LOWER(v.make) LIKE :like OR LOWER(v.model) LIKE :like)',
        { like },
      );
    }
    if (query.status) {
      qb.andWhere('v.status = :status', { status: query.status });
    }
    if (query.category) {
      qb.andWhere('v.category = :category', { category: query.category });
    }

    const total = await qb.getCount();
    qb.orderBy('v.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const vehicles = await qb.getMany();

    const costMap = await this.buildCostMap(userId);
    const items = vehicles.map((v) => ({
      ...v,
      costTotal: costMap.get(v.id) ?? 0,
    }));

    return { items, total, page, limit };
  }

  private async buildCostMap(userId: string): Promise<Map<string, number>> {
    const vehicleIds = await this.vehicleRepository
      .find({ where: { userId } })
      .then((vs) => vs.map((v) => v.id));
    const map = new Map<string, number>();
    if (vehicleIds.length === 0) return map;

    const services = await this.serviceRepository.find({
      where: { vehicleId: In(vehicleIds) },
    });
    const fuels = await this.fuelRepository.find({
      where: { vehicleId: In(vehicleIds) },
    });
    for (const s of services) {
      map.set(s.vehicleId, (map.get(s.vehicleId) ?? 0) + Number(s.cost));
    }
    for (const f of fuels) {
      map.set(f.vehicleId, (map.get(f.vehicleId) ?? 0) + Number(f.cost));
    }
    return map;
  }

  async findOne(userId: string, id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id, userId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }
    return vehicle;
  }

  async getMaxRegisteredOdometer(vehicleId: string): Promise<number> {
    const [s, f] = await Promise.all([
      this.serviceRepository.find({ where: { vehicleId } }),
      this.fuelRepository.find({ where: { vehicleId } }),
    ]);
    let max = 0;
    for (const r of s) max = Math.max(max, r.odometer);
    for (const r of f) max = Math.max(max, r.odometer);
    return max;
  }

  async summary(userId: string, id: string) {
    const vehicle = await this.findOne(userId, id);

    const [tasks, services, fuelLogs] = await Promise.all([
      this.taskRepository.find({
        where: { vehicleId: id },
        order: { createdAt: 'ASC' },
      }),
      this.serviceRepository.find({
        where: { vehicleId: id },
        order: { date: 'DESC', createdAt: 'DESC' },
      }),
      this.fuelRepository.find({
        where: { vehicleId: id },
        order: { date: 'DESC', createdAt: 'DESC' },
      }),
    ]);

    const tasksWithStatus = tasks.map((t) => ({
      ...t,
      status: computeTaskStatus(t, vehicle.currentOdometer),
    }));

    const totalService = services.reduce((s, r) => s + Number(r.cost), 0);
    const totalFuel = fuelLogs.reduce((s, r) => s + Number(r.cost), 0);
    const fullTankLogs = [...fuelLogs]
      .filter((f) => f.fullTank)
      .sort((a, b) => a.date.localeCompare(b.date));
    let consumption: number | null = null;
    let prev: FuelLog | null = null;
    let samples = 0;
    let acc = 0;
    for (const f of fullTankLogs) {
      if (prev && f.odometer > prev.odometer) {
        const kmDelta = f.odometer - prev.odometer;
        const l100 = (Number(f.liters) / (kmDelta / 100));
        if (l100 > 0) {
          acc += l100;
          samples += 1;
        }
      }
      prev = f;
    }
    if (samples > 0) consumption = Math.round((acc / samples) * 10) / 10;

    const stats = {
      totalCost: Math.round((totalService + totalFuel) * 100) / 100,
      totalService,
      totalFuel,
      avgConsumption: consumption,
      taskCount: tasks.length,
      serviceCount: services.length,
      fuelCount: fuelLogs.length,
      lastServiceDate: services.length > 0 ? services[0].date : null,
    };

    return { vehicle, stats, tasks: tasksWithStatus, services, fuelLogs };
  }

  async dashboard(userId: string): Promise<DashboardPayload> {
    const vehicles = await this.vehicleRepository.find({ where: { userId } });
    const kpis = {
      active: vehicles.filter((v) => v.status === 'active').length,
      maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
      retired: vehicles.filter((v) => v.status === 'retired').length,
    };

    const manageable = vehicles.filter((v) => v.status !== 'retired');
    const manageableIds = manageable.map((v) => v.id);
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

    // Sincronizar reminders (genera due/overdue pendientes, ack automático de los resueltos)
    if (manageableIds.length > 0) {
      const tasks = await this.taskRepository.find({
        where: { vehicleId: In(manageableIds) },
      });
      for (const task of tasks) {
        const vehicle = vehicleById.get(task.vehicleId);
        const status = computeTaskStatus(task, vehicle?.currentOdometer ?? 0);
        if (status === 'due' || status === 'overdue') {
          const existing = await this.reminderRepository.findOne({
            where: { taskId: task.id, type: status, acknowledgedAt: IsNull() },
          });
          if (!existing) {
            await this.reminderRepository.save(
              this.reminderRepository.create({
                userId,
                vehicleId: task.vehicleId,
                taskId: task.id,
                dueDate: task.nextDueDate ?? new Date(),
                type: status,
              } as any) as unknown as Reminder,
            );
          }
        } else {
          await this.reminderRepository.update(
            { taskId: task.id },
            { acknowledgedAt: new Date() },
          );
        }
      }
    }

    const pending = await this.reminderRepository.find({
      where: { userId, acknowledgedAt: IsNull() },
      order: { dueDate: 'ASC' },
    });
    const taskIds = [...new Set(pending.map((r) => r.taskId))];
    const tasks = taskIds.length > 0
      ? await this.taskRepository.find({ where: { id: In(taskIds) } })
      : [];
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const alerts = pending
      .filter((r) => {
        const v = vehicleById.get(r.vehicleId);
        return v && v.status !== 'retired';
      })
      .map((r) => {
        const task = taskById.get(r.taskId);
        const v = vehicleById.get(r.vehicleId);
        return {
          id: r.id,
          taskId: r.taskId,
          vehicleId: r.vehicleId,
          type: r.type,
          dueDate: r.dueDate,
          taskName: task?.name ?? 'Tarea',
          plate: v?.plate ?? '',
          acknowledgedAt: r.acknowledgedAt,
        };
      });

    // Coste del mes actual
    const now = new Date();
    const monthPrefix = now.toISOString().slice(0, 7);
    let fuel = 0;
    let service = 0;
    if (manageableIds.length > 0) {
      const [services, fuels] = await Promise.all([
        this.serviceRepository.find({ where: { vehicleId: In(manageableIds) } }),
        this.fuelRepository.find({ where: { vehicleId: In(manageableIds) } }),
      ]);
      for (const s of services) {
        if ((s.date ?? '').startsWith(monthPrefix)) service += Number(s.cost);
      }
      for (const f of fuels) {
        if ((f.date ?? '').startsWith(monthPrefix)) fuel += Number(f.cost);
      }
    }
    const monthlyCost = {
      fuel: Math.round(fuel * 100) / 100,
      service: Math.round(service * 100) / 100,
      total: Math.round((fuel + service) * 100) / 100,
    };

    return { kpis, alerts, monthlyCost };
  }

  async create(userId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    const plate = this.normalizePlate(dto.plate);
    const year = dto.year;
    const maxYear = new Date().getFullYear() + 1;
    if (year < 1950 || year > maxYear) {
      throw new UnprocessableEntityException(
        `El año debe estar entre 1950 y ${maxYear}`,
      );
    }
    const clash = await this.vehicleRepository.findOne({ where: { plate } });
    if (clash) {
      throw new ConflictException('Ya existe un vehículo con esa matrícula');
    }
    const vehicle = this.vehicleRepository.create({
      userId,
      plate,
      make: dto.make,
      model: dto.model,
      year,
      category: dto.category,
      fuelType: dto.fuelType,
      currentOdometer: dto.currentOdometer ?? 0,
      specs: dto.specs ?? {},
    } as any);
    return (await this.vehicleRepository.save(vehicle)) as unknown as Vehicle;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    const vehicle = await this.findOne(userId, id);

    if (dto.plate !== undefined) {
      const plate = this.normalizePlate(dto.plate);
      const clash = await this.vehicleRepository.findOne({ where: { plate } });
      if (clash && clash.id !== id) {
        throw new ConflictException('Ya existe un vehículo con esa matrícula');
      }
      vehicle.plate = plate;
    }
    if (dto.currentOdometer !== undefined) {
      const maxOdo = await this.getMaxRegisteredOdometer(id);
      if (dto.currentOdometer < maxOdo) {
        throw new UnprocessableEntityException(
          `El odómetro no puede ser menor al último registro (${maxOdo} km)`,
        );
      }
      vehicle.currentOdometer = dto.currentOdometer;
    }
    if (dto.make !== undefined) vehicle.make = dto.make;
    if (dto.model !== undefined) vehicle.model = dto.model;
    if (dto.year !== undefined) {
      const maxYear = new Date().getFullYear() + 1;
      if (dto.year < 1950 || dto.year > maxYear) {
        throw new UnprocessableEntityException(
          `El año debe estar entre 1950 y ${maxYear}`,
        );
      }
      vehicle.year = dto.year;
    }
    if (dto.category !== undefined) vehicle.category = dto.category;
    if (dto.fuelType !== undefined) vehicle.fuelType = dto.fuelType;
    if (dto.status !== undefined) vehicle.status = dto.status;
    if (dto.specs !== undefined) vehicle.specs = dto.specs;

    return (await this.vehicleRepository.save(vehicle)) as unknown as Vehicle;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.vehicleRepository.delete({ id, userId });
  }

  async exportCsv(userId: string): Promise<{ filename: string; csv: string }> {
    const vehicles = await this.vehicleRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    const costMap = await this.buildCostMap(userId);
    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['matricula', 'marca', 'modelo', 'año', 'categoria', 'combustible', 'odometro', 'estado', 'coste_total'];
    const rows = vehicles.map((v) => [
      v.plate,
      v.make,
      v.model,
      v.year,
      v.category,
      v.fuelType,
      v.currentOdometer,
      v.status,
      (costMap.get(v.id) ?? 0).toFixed(2),
    ]);
    return {
      filename: `vehiculos-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: [header, ...rows].map((r) => r.map(escape).join(',')).join('\n'),
    };
  }
}

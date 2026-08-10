import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';
import {
  MaintenanceTask,
  computeNextDue,
} from '../entities/maintenance-task.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { FuelLog } from '../entities/fuel-log.entity';
import { Reminder } from '../entities/reminder.entity';

const DEMO_USER = {
  username: 'demo',
  email: 'demo@fleetkeeper.dev',
  password: 'demo1234',
  role: 'admin' as const,
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async seed() {
    const count = await this.userRepository.count();
    if (count > 0) {
      this.logger.log(`Seed: ${count} usuarios ya existen, skip demo data`);
      return;
    }

    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
    const user = await this.userRepository.save(
      this.userRepository.create({
        username: DEMO_USER.username,
        email: DEMO_USER.email,
        passwordHash,
        role: DEMO_USER.role,
        theme: 'system',
      } as any) as unknown as User,
    );
    this.logger.log(`Seed: usuario demo creado (${user.id})`);

    // Vehículos
    const kangoo = await this.vehicleRepository.save(
      this.vehicleRepository.create({
        userId: user.id,
        plate: '2341-FGH',
        make: 'Renault',
        model: 'Kangoo',
        year: 2019,
        category: 'van',
        fuelType: 'diesel',
        currentOdometer: 84480,
        status: 'active',
        specs: { trailer: true, gps: true },
      } as any) as unknown as Vehicle,
    );
    const transit = await this.vehicleRepository.save(
      this.vehicleRepository.create({
        userId: user.id,
        plate: '5678-JKL',
        make: 'Ford',
        model: 'Transit',
        year: 2021,
        category: 'truck',
        fuelType: 'diesel',
        currentOdometer: 46210,
        status: 'active',
        specs: { liftGate: true },
      } as any) as unknown as Vehicle,
    );
    const ibiza = await this.vehicleRepository.save(
      this.vehicleRepository.create({
        userId: user.id,
        plate: '9012-MNO',
        make: 'Seat',
        model: 'Ibiza',
        year: 2017,
        category: 'car',
        fuelType: 'petrol',
        currentOdometer: 128400,
        status: 'maintenance',
        specs: {},
      } as any) as unknown as Vehicle,
    );

    // Tareas — Kangoo: aceite VENCIDA por fecha (13 meses, intervalo 12)
    const oilTask = await this.taskRepository.save(
      this.taskRepository.create({
        vehicleId: kangoo.id,
        name: 'Cambio de aceite',
        type: 'oil',
        intervalKm: 10000,
        intervalMonths: 12,
        lastDoneAt: new Date(`${isoDaysAgo(395)}T12:00:00`),
        lastOdometerKm: 74480,
        notes: 'Aceite 5W-30 + filtro',
      } as any) as unknown as MaintenanceTask,
    );
    const oilNext = computeNextDue(oilTask);
    oilTask.nextDueKm = oilNext.nextDueKm;
    oilTask.nextDueDate = oilNext.nextDueDate;
    await this.taskRepository.save(oilTask as any);

    // Kangoo: ITV — vence en ~1 mes (due)
    const itvTask = await this.taskRepository.save(
      this.taskRepository.create({
        vehicleId: kangoo.id,
        name: 'ITV',
        type: 'itv',
        intervalKm: null,
        intervalMonths: 12,
        lastDoneAt: new Date(`${isoDaysAgo(335)}T12:00:00`),
        lastOdometerKm: null,
        notes: '',
      } as any) as unknown as MaintenanceTask,
    );
    const itvNext = computeNextDue(itvTask);
    itvTask.nextDueKm = itvNext.nextDueKm;
    itvTask.nextDueDate = itvNext.nextDueDate;
    await this.taskRepository.save(itvTask as any);

    // Kangoo: Frenos — upcoming por km
    await this.taskRepository.save(
      this.taskRepository.create({
        vehicleId: kangoo.id,
        name: 'Pastillas de freno',
        type: 'brakes',
        intervalKm: 30000,
        intervalMonths: null,
        lastDoneAt: new Date(`${isoDaysAgo(500)}T12:00:00`),
        lastOdometerKm: 61000,
        notes: '',
      } as any) as unknown as MaintenanceTask,
    );

    // Transit: aceite — upcoming por km
    const transitOil = await this.taskRepository.save(
      this.taskRepository.create({
        vehicleId: transit.id,
        name: 'Cambio de aceite',
        type: 'oil',
        intervalKm: 15000,
        intervalMonths: 12,
        lastDoneAt: new Date(`${isoDaysAgo(150)}T12:00:00`),
        lastOdometerKm: 31210,
        notes: '',
      } as any) as unknown as MaintenanceTask,
    );
    const transitOilNext = computeNextDue(transitOil);
    transitOil.nextDueKm = transitOilNext.nextDueKm;
    transitOil.nextDueDate = transitOilNext.nextDueDate;
    await this.taskRepository.save(transitOil as any);

    // Ibiza: en taller — ITV vencida (overdue)
    const ibizaItv = await this.taskRepository.save(
      this.taskRepository.create({
        vehicleId: ibiza.id,
        name: 'ITV',
        type: 'itv',
        intervalKm: null,
        intervalMonths: 12,
        lastDoneAt: new Date(`${isoDaysAgo(420)}T12:00:00`),
        lastOdometerKm: null,
        notes: '',
      } as any) as unknown as MaintenanceTask,
    );
    const ibizaItvNext = computeNextDue(ibizaItv);
    ibizaItv.nextDueKm = ibizaItvNext.nextDueKm;
    ibizaItv.nextDueDate = ibizaItvNext.nextDueDate;
    await this.taskRepository.save(ibizaItv as any);

    // Servicios (historial)
    await this.serviceRepository.save(
      this.serviceRepository.create({
        vehicleId: kangoo.id,
        taskId: oilTask.id,
        date: isoDaysAgo(395),
        odometer: 74480,
        cost: 148.5,
        vendor: 'Taller Hermanos Ruiz',
        notes: 'Aceite 5W-30 + filtro de aceite',
      } as any) as unknown as ServiceRecord,
    );
    await this.serviceRepository.save(
      this.serviceRepository.create({
        vehicleId: kangoo.id,
        date: isoDaysAgo(15),
        odometer: 84300,
        cost: 89.9,
        vendor: 'Eurotaller Express',
        notes: 'Limpieza inyectores',
      } as any) as unknown as ServiceRecord,
    );
    await this.serviceRepository.save(
      this.serviceRepository.create({
        vehicleId: transit.id,
        taskId: transitOil.id,
        date: isoDaysAgo(150),
        odometer: 31210,
        cost: 162.0,
        vendor: 'Taller Hermanos Ruiz',
        notes: 'Aceite 5W-30 + filtro',
      } as any) as unknown as ServiceRecord,
    );

    // Repostajes — serie realista para consumo Kangoo (~6.9 l/100km)
    const fuelSeries: Array<[number, number, number, number, boolean]> = [
      // [daysAgo, odometer, liters, cost, fullTank]
      [70, 82100, 40.2, 71.1, true],
      [53, 82700, 42.0, 74.3, true],
      [36, 83300, 41.5, 73.5, true],
      [19, 83890, 41.0, 72.6, true],
      [7, 84480, 39.5, 69.9, true],
    ];
    for (const [daysAgo, odometer, liters, cost, fullTank] of fuelSeries) {
      await this.fuelRepository.save(
        this.fuelRepository.create({
          vehicleId: kangoo.id,
          date: isoDaysAgo(daysAgo),
          odometer,
          liters,
          cost,
          fullTank,
        } as any) as unknown as FuelLog,
      );
    }
    await this.fuelRepository.save(
      this.fuelRepository.create({
        vehicleId: transit.id,
        date: isoDaysAgo(10),
        odometer: 45890,
        liters: 55.0,
        cost: 97.35,
        fullTank: true,
      } as any) as unknown as FuelLog,
    );

    // Recordatorios: sincronizar (genera due/overdue no acked)
    const now = new Date();
    const tasks = await this.taskRepository.find({
      where: { vehicleId: In([kangoo.id, transit.id, ibiza.id]) },
    });
    const vehicles = await this.vehicleRepository.find({ where: { userId: user.id } });
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
    for (const task of tasks) {
      const vehicle = vehicleById.get(task.vehicleId);
      if (!vehicle || vehicle.status === 'retired') continue;
      const isOverdue =
        (task.nextDueDate != null && new Date(task.nextDueDate) < now) ||
        (task.nextDueKm != null && task.nextDueKm <= vehicle.currentOdometer);
      if (isOverdue) {
        await this.reminderRepository.save(
          this.reminderRepository.create({
            userId: user.id,
            vehicleId: task.vehicleId,
            taskId: task.id,
            dueDate: task.nextDueDate ?? new Date(),
            type: 'overdue',
          } as any) as unknown as Reminder,
        );
      } else {
        const dueWindow = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
        const isDue =
          (task.nextDueDate != null && new Date(task.nextDueDate) <= dueWindow) ||
          (task.nextDueKm != null &&
            task.nextDueKm <= vehicle.currentOdometer + 2000);
        if (isDue) {
          await this.reminderRepository.save(
            this.reminderRepository.create({
              userId: user.id,
              vehicleId: task.vehicleId,
              taskId: task.id,
              dueDate: task.nextDueDate ?? new Date(),
              type: 'due',
            } as any) as unknown as Reminder,
          );
        }
      }
    }

    this.logger.log(
      `Seed complete: 3 vehículos, ${tasks.length} tareas, 3 servicios, ${fuelSeries.length + 1} repostajes, recordatorios sincronizados`,
    );
  }
}

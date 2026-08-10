import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuelLog } from '../entities/fuel-log.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { CreateFuelLogDto, UpdateFuelLogDto } from './dto/fuel-log.dto';

@Injectable()
export class FuelLogsService {
  constructor(
    @InjectRepository(FuelLog)
    private fuelRepository: Repository<FuelLog>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  private async assertVehicle(
    userId: string,
    vehicleId: string,
  ): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId, userId },
    });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }

  async findAll(
    userId: string,
    query: { vehicleId?: string; from?: string; to?: string },
  ): Promise<FuelLog[]> {
    const vehicles = await this.vehicleRepository.find({ where: { userId } });
    const ids = new Set(vehicles.map((v) => v.id));
    if (query.vehicleId && !ids.has(query.vehicleId)) return [];

    let logs: FuelLog[];
    if (query.vehicleId) {
      logs = await this.fuelRepository.find({
        where: { vehicleId: query.vehicleId },
        order: { date: 'DESC', createdAt: 'DESC' },
      });
    } else {
      const all = await this.fuelRepository.find({
        order: { date: 'DESC', createdAt: 'DESC' },
      });
      logs = all.filter((l) => ids.has(l.vehicleId));
    }

    if (query.from) logs = logs.filter((l) => l.date >= query.from!);
    if (query.to) logs = logs.filter((l) => l.date <= query.to!);
    return logs;
  }

  async findOne(userId: string, id: string): Promise<FuelLog> {
    const log = await this.fuelRepository.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Repostaje no encontrado');
    await this.assertVehicle(userId, log.vehicleId);
    return log;
  }

  async create(userId: string, dto: CreateFuelLogDto): Promise<FuelLog> {
    const vehicle = await this.assertVehicle(userId, dto.vehicleId);

    if (dto.odometer < vehicle.currentOdometer) {
      throw new UnprocessableEntityException(
        `El odómetro no puede ser menor al último registrado (${vehicle.currentOdometer} km)`,
      );
    }

    const log = this.fuelRepository.create({
      vehicleId: vehicle.id,
      date: dto.date,
      odometer: dto.odometer,
      liters: dto.liters,
      cost: dto.cost,
      fullTank: dto.fullTank ?? true,
    } as any);
    const saved = (await this.fuelRepository.save(log)) as unknown as FuelLog;

    if (dto.odometer > vehicle.currentOdometer) {
      vehicle.currentOdometer = dto.odometer;
      await this.vehicleRepository.save(vehicle as any);
    }

    return saved;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateFuelLogDto,
  ): Promise<FuelLog> {
    const log = await this.findOne(userId, id);
    if (dto.date !== undefined) log.date = dto.date;
    if (dto.odometer !== undefined) log.odometer = dto.odometer;
    if (dto.liters !== undefined) log.liters = dto.liters;
    if (dto.cost !== undefined) log.cost = dto.cost;
    if (dto.fullTank !== undefined) log.fullTank = dto.fullTank;
    return (await this.fuelRepository.save(log as any)) as unknown as FuelLog;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.fuelRepository.delete({ id });
  }

  async exportCsv(userId: string): Promise<{ filename: string; csv: string }> {
    const logs = await this.findAll(userId, {});
    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ['fecha', 'odometro', 'litros', 'coste', 'tanque_lleno', 'vehiculo_id'];
    const rows = logs.map((l) => [
      l.date,
      l.odometer,
      Number(l.liters).toFixed(2),
      Number(l.cost).toFixed(2),
      l.fullTank ? 'si' : 'no',
      l.vehicleId,
    ]);
    return {
      filename: `repostajes-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: [header, ...rows].map((r) => r.map(escape).join(',')).join('\n'),
    };
  }
}

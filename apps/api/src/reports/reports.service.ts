import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Vehicle } from '../entities/vehicle.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { FuelLog } from '../entities/fuel-log.entity';

export interface CostRow {
  month: string;
  fuel: number;
  service: number;
  total: number;
}

export interface ByVehicleCost {
  vehicleId: string;
  plate: string;
  fuel: number;
  service: number;
  total: number;
}

export interface EfficiencyEntry {
  date: string;
  liters: number;
  kmDelta: number;
  lPer100km: number;
}

export interface EfficiencyReport {
  vehicleId: string;
  plate: string;
  entries: EfficiencyEntry[];
  avg: number | null;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(ServiceRecord)
    private serviceRepository: Repository<ServiceRecord>,
    @InjectRepository(FuelLog)
    private fuelRepository: Repository<FuelLog>,
  ) {}

  async costs(
    userId: string,
    query: { from?: string; to?: string; vehicleId?: string },
  ): Promise<{ byMonth: CostRow[]; byVehicle: ByVehicleCost[] }> {
    const vehicles = await this.vehicleRepository.find({ where: { userId } });
    if (vehicles.length === 0) return { byMonth: [], byVehicle: [] };
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

    const vehicleIds = query.vehicleId
      ? vehicleById.has(query.vehicleId)
        ? [query.vehicleId]
        : []
      : vehicles.map((v) => v.id);
    if (vehicleIds.length === 0) return { byMonth: [], byVehicle: [] };

    const [services, fuels] = await Promise.all([
      this.serviceRepository.find({ where: { vehicleId: In(vehicleIds) } }),
      this.fuelRepository.find({ where: { vehicleId: In(vehicleIds) } }),
    ]);

    // Defensa extra: descartar registros fuera del filtro (mocks / edge cases)
    const allowed = new Set(vehicleIds);
    const scopedServices = services.filter((s) => allowed.has(s.vehicleId));
    const scopedFuels = fuels.filter((f) => allowed.has(f.vehicleId));

    const filterRange = (date: string): boolean => {
      if (query.from && date < query.from) return false;
      if (query.to && date > query.to) return false;
      return true;
    };

    const byMonth = new Map<string, CostRow>();
    const byVehicle = new Map<string, ByVehicleCost>();

    for (const s of scopedServices) {
      if (!filterRange(s.date)) continue;
      const month = s.date.slice(0, 7);
      const row = byMonth.get(month) ?? { month, fuel: 0, service: 0, total: 0 };
      row.service += Number(s.cost);
      row.total += Number(s.cost);
      byMonth.set(month, row);

      const v = byVehicle.get(s.vehicleId) ?? {
        vehicleId: s.vehicleId,
        plate: vehicleById.get(s.vehicleId)?.plate ?? '',
        fuel: 0,
        service: 0,
        total: 0,
      };
      v.service += Number(s.cost);
      v.total += Number(s.cost);
      byVehicle.set(s.vehicleId, v);
    }
    for (const f of scopedFuels) {
      if (!filterRange(f.date)) continue;
      const month = f.date.slice(0, 7);
      const row = byMonth.get(month) ?? { month, fuel: 0, service: 0, total: 0 };
      row.fuel += Number(f.cost);
      row.total += Number(f.cost);
      byMonth.set(month, row);

      const v = byVehicle.get(f.vehicleId) ?? {
        vehicleId: f.vehicleId,
        plate: vehicleById.get(f.vehicleId)?.plate ?? '',
        fuel: 0,
        service: 0,
        total: 0,
      };
      v.fuel += Number(f.cost);
      v.total += Number(f.cost);
      byVehicle.set(f.vehicleId, v);
    }

    const round = (n: number) => Math.round(n * 100) / 100;
    const byMonthList = [...byMonth.values()]
      .map((r) => ({ ...r, fuel: round(r.fuel), service: round(r.service), total: round(r.total) }))
      .sort((a, b) => a.month.localeCompare(b.month));
    const byVehicleList = [...byVehicle.values()]
      .map((r) => ({ ...r, fuel: round(r.fuel), service: round(r.service), total: round(r.total) }))
      .sort((a, b) => b.total - a.total);

    return { byMonth: byMonthList, byVehicle: byVehicleList };
  }

  async efficiency(
    userId: string,
    vehicleId?: string,
  ): Promise<EfficiencyReport[]> {
    const vehicles = await this.vehicleRepository.find({ where: { userId } });
    const ids = vehicleId
      ? vehicles.filter((v) => v.id === vehicleId).map((v) => v.id)
      : vehicles.map((v) => v.id);
    const reports: EfficiencyReport[] = [];

    for (const id of ids) {
      const vehicle = vehicles.find((v) => v.id === id)!;
      const logs = await this.fuelRepository.find({
        where: { vehicleId: id },
        order: { date: 'ASC', createdAt: 'ASC' },
      });
      const fullTank = logs
        .filter((l) => l.fullTank)
        .sort((a, b) => a.date.localeCompare(b.date));

      const entries: EfficiencyEntry[] = [];
      let prev: FuelLog | null = null;
      let acc = 0;
      let samples = 0;
      for (const f of fullTank) {
        if (prev && f.odometer > prev.odometer) {
          const kmDelta = f.odometer - prev.odometer;
          const l100 = Number(f.liters) / (kmDelta / 100);
          if (l100 > 0) {
            entries.push({
              date: f.date,
              liters: Number(f.liters),
              kmDelta,
              lPer100km: Math.round(l100 * 10) / 10,
            });
            acc += l100;
            samples += 1;
          }
        }
        prev = f;
      }
      reports.push({
        vehicleId: id,
        plate: vehicle.plate,
        entries,
        avg: samples > 0 ? Math.round((acc / samples) * 10) / 10 : null,
      });
    }
    return reports;
  }
}

import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { Vehicle } from '../entities/vehicle.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { FuelLog } from '../entities/fuel-log.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let vehicleRepo: any;
  let serviceRepo: any;
  let fuelRepo: any;

  const vehicles = [
    { id: 'v-1', userId: 'u-1', plate: '2341-FGH' },
    { id: 'v-2', userId: 'u-1', plate: '5678-JKL' },
  ];

  beforeEach(() => {
    vehicleRepo = { find: jest.fn() };
    serviceRepo = { find: jest.fn() };
    fuelRepo = { find: jest.fn() };

    service = new ReportsService(
      vehicleRepo as any,
      serviceRepo as any,
      fuelRepo as any,
    );
  });

  describe('costs', () => {
    it('agrega costes por mes y por vehículo', async () => {
      vehicleRepo.find.mockResolvedValue(vehicles);
      serviceRepo.find.mockResolvedValue([
        { vehicleId: 'v-1', date: '2026-07-15', cost: 148.5 },
        { vehicleId: 'v-1', date: '2026-08-02', cost: 89.9 },
      ]);
      fuelRepo.find.mockResolvedValue([
        { vehicleId: 'v-1', date: '2026-08-03', cost: 69.9 },
        { vehicleId: 'v-2', date: '2026-08-10', cost: 97.35 },
      ]);

      const result = await service.costs('u-1', {});
      const aug = result.byMonth.find((r) => r.month === '2026-08');
      expect(aug).toBeDefined();
      expect(aug!.fuel).toBeCloseTo(167.25, 2);
      expect(aug!.service).toBeCloseTo(89.9, 2);
      expect(aug!.total).toBeCloseTo(257.15, 2);

      const kangoo = result.byVehicle.find((r) => r.vehicleId === 'v-1');
      expect(kangoo!.plate).toBe('2341-FGH');
      expect(kangoo!.total).toBeCloseTo(308.3, 2);
    });

    it('respeta el filtro por vehículo', async () => {
      vehicleRepo.find.mockResolvedValue(vehicles);
      serviceRepo.find.mockResolvedValue([]);
      fuelRepo.find.mockResolvedValue([
        { vehicleId: 'v-1', date: '2026-08-03', cost: 69.9 },
        { vehicleId: 'v-2', date: '2026-08-10', cost: 97.35 },
      ]);

      const result = await service.costs('u-1', { vehicleId: 'v-2' });
      expect(result.byVehicle).toHaveLength(1);
      expect(result.byVehicle[0].vehicleId).toBe('v-2');
    });
  });

  describe('efficiency', () => {
    it('calcula l/100km entre repostajes full-tank y el promedio', async () => {
      vehicleRepo.find.mockResolvedValue([vehicles[0]]);
      fuelRepo.find.mockResolvedValue([
        { vehicleId: 'v-1', date: '2026-06-01', odometer: 82100, liters: 40.2, fullTank: true },
        { vehicleId: 'v-1', date: '2026-06-18', odometer: 82700, liters: 42.0, fullTank: true },
        { vehicleId: 'v-1', date: '2026-07-05', odometer: 83300, liters: 41.5, fullTank: true },
        { vehicleId: 'v-1', date: '2026-07-22', odometer: 83890, liters: 41.0, fullTank: true },
        { vehicleId: 'v-1', date: '2026-08-03', odometer: 84480, liters: 39.5, fullTank: true },
      ]);

      const result = await service.efficiency('u-1');
      expect(result).toHaveLength(1);
      expect(result[0].entries).toHaveLength(4);
      // 600km, 42L → 7.0 l/100km
      expect(result[0].entries[0].lPer100km).toBe(7.0);
      // avg ≈ (7.0 + 6.9 + 6.9 + 6.7) / 4 ≈ 6.9
      expect(result[0].avg).toBe(6.9);
    });

    it('devuelve avg null sin repostajes full-tank suficientes', async () => {
      vehicleRepo.find.mockResolvedValue([vehicles[0]]);
      fuelRepo.find.mockResolvedValue([
        { vehicleId: 'v-1', date: '2026-08-01', odometer: 84000, liters: 20, fullTank: false },
      ]);

      const result = await service.efficiency('u-1', 'v-1');
      expect(result[0].entries).toHaveLength(0);
      expect(result[0].avg).toBeNull();
    });
  });
});

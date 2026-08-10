import { Test } from '@nestjs/testing';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from '../entities/vehicle.entity';
import { MaintenanceTask } from '../entities/maintenance-task.entity';
import { ServiceRecord } from '../entities/service-record.entity';
import { FuelLog } from '../entities/fuel-log.entity';
import { Reminder } from '../entities/reminder.entity';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepo: any;
  let taskRepo: any;
  let serviceRepo: any;
  let fuelRepo: any;
  let reminderRepo: any;

  const baseVehicle = {
    id: 'v-1',
    userId: 'u-1',
    plate: '2341-FGH',
    make: 'Renault',
    model: 'Kangoo',
    year: 2019,
    category: 'van',
    fuelType: 'diesel',
    currentOdometer: 84480,
    status: 'active',
    specs: {},
  };

  beforeEach(() => {
    vehicleRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data: any) => data),
      save: jest.fn((data: any) => Promise.resolve(data)),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    taskRepo = { find: jest.fn(), findOne: jest.fn() };
    serviceRepo = { find: jest.fn() };
    fuelRepo = { find: jest.fn() };
    reminderRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((d: any) => d),
      save: jest.fn((d: any) => Promise.resolve(d)),
      update: jest.fn(),
    };

    service = new VehiclesService(
      vehicleRepo as any,
      taskRepo as any,
      serviceRepo as any,
      fuelRepo as any,
      reminderRepo as any,
    );
  });

  describe('create', () => {
    it('normaliza la matrícula a mayúsculas con guiones', async () => {
      vehicleRepo.findOne.mockResolvedValue(null);
      vehicleRepo.save.mockResolvedValue(baseVehicle);

      const result = await service.create('u-1', {
        plate: ' 2341 fgh ',
        make: 'Renault',
        model: 'Kangoo',
        year: 2019,
        category: 'van',
        fuelType: 'diesel',
      } as any);

      expect(vehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ plate: '2341-FGH' }),
      );
      expect(result).toBeTruthy();
    });

    it('rechaza matrícula duplicada con 409', async () => {
      vehicleRepo.findOne.mockResolvedValue(baseVehicle);
      await expect(
        service.create('u-1', {
          plate: '2341-FGH',
          make: 'Renault',
          model: 'Kangoo',
          year: 2019,
          category: 'van',
          fuelType: 'diesel',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza año fuera de rango con 422', async () => {
      vehicleRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create('u-1', {
          plate: '9999-AAA',
          make: 'X',
          model: 'Y',
          year: 1900,
          category: 'car',
          fuelType: 'petrol',
        } as any),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('update', () => {
    it('rechaza bajar el odómetro por debajo del último registro', async () => {
      vehicleRepo.findOne.mockResolvedValue(baseVehicle);
      serviceRepo.find.mockResolvedValue([
        { odometer: 85000, vehicleId: 'v-1' },
      ]);
      fuelRepo.find.mockResolvedValue([]);

      await expect(
        service.update('u-1', 'v-1', { currentOdometer: 80000 } as any),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('summary', () => {
    it('calcula consumo medio con repostajes de tanque lleno', async () => {
      vehicleRepo.findOne.mockResolvedValue(baseVehicle);
      taskRepo.find.mockResolvedValue([]);
      serviceRepo.find.mockResolvedValue([]);
      fuelRepo.find.mockResolvedValue([
        { id: 'f1', date: '2026-06-01', odometer: 82100, liters: 40.2, cost: 71.1, fullTank: true },
        { id: 'f2', date: '2026-06-18', odometer: 82700, liters: 42.0, cost: 74.3, fullTank: true },
        { id: 'f3', date: '2026-07-05', odometer: 83300, liters: 41.5, cost: 73.5, fullTank: true },
        { id: 'f4', date: '2026-07-22', odometer: 83890, liters: 41.0, cost: 72.6, fullTank: true },
        { id: 'f5', date: '2026-08-03', odometer: 84480, liters: 39.5, cost: 69.9, fullTank: true },
      ]);

      const result = await service.summary('u-1', 'v-1');
      // 600km → 42L = 7.0; 600 → 41.5 = 6.9; 590 → 41 = 6.9; 590 → 39.5 = 6.7
      // avg = (7.0+6.9+6.9+6.7)/4 ≈ 6.9
      expect(result.stats.avgConsumption).toBe(6.9);
      expect(result.stats.fuelCount).toBe(5);
    });

    it('ignora repostajes con tanque parcial para el consumo', async () => {
      vehicleRepo.findOne.mockResolvedValue(baseVehicle);
      taskRepo.find.mockResolvedValue([]);
      serviceRepo.find.mockResolvedValue([]);
      fuelRepo.find.mockResolvedValue([
        { id: 'f1', date: '2026-07-01', odometer: 82000, liters: 20, cost: 35, fullTank: false },
        { id: 'f2', date: '2026-07-20', odometer: 82600, liters: 42, cost: 74, fullTank: true },
      ]);

      const result = await service.summary('u-1', 'v-1');
      expect(result.stats.avgConsumption).toBeNull();
    });
  });

  describe('dashboard', () => {
    it('genera reminder overdue cuando la tarea está vencida y no acuseado', async () => {
      vehicleRepo.find.mockResolvedValue([baseVehicle]);
      const overdueTask = {
        id: 't-1',
        vehicleId: 'v-1',
        name: 'ITV',
        nextDueKm: null,
        nextDueDate: new Date('2026-06-10T12:00:00'),
        lastDoneAt: null,
      };
      taskRepo.find.mockResolvedValue([overdueTask]);
      reminderRepo.findOne.mockResolvedValue(null);
      reminderRepo.find.mockResolvedValue([]);
      serviceRepo.find.mockResolvedValue([]);
      fuelRepo.find.mockResolvedValue([]);

      const result = await service.dashboard('u-1');
      expect(reminderRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'overdue', taskId: 't-1' }),
      );
      expect(result.kpis.active).toBe(1);
    });

    it('calcula coste del mes actual (combustible + servicios)', async () => {
      vehicleRepo.find.mockResolvedValue([baseVehicle]);
      taskRepo.find.mockResolvedValue([]);
      reminderRepo.find.mockResolvedValue([]);
      const month = new Date().toISOString().slice(0, 7);
      serviceRepo.find.mockResolvedValue([
        { vehicleId: 'v-1', date: `${month}-02`, cost: 180 },
        { vehicleId: 'v-1', date: '2026-01-10', cost: 500 },
      ]);
      fuelRepo.find.mockResolvedValue([
        { vehicleId: 'v-1', date: `${month}-03`, cost: 69.9 },
      ]);

      const result = await service.dashboard('u-1');
      expect(result.monthlyCost.service).toBe(180);
      expect(result.monthlyCost.fuel).toBe(69.9);
      expect(result.monthlyCost.total).toBeCloseTo(249.9, 1);
    });
  });
});

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'driver';
  theme: 'light' | 'dark' | 'system';
}

export type VehicleCategory = 'car' | 'van' | 'truck' | 'motorcycle' | 'other';
export type VehicleFuelType = 'diesel' | 'petrol' | 'electric' | 'hybrid' | 'lpg';
export type VehicleStatus = 'active' | 'maintenance' | 'retired';

export interface Vehicle {
  id: string;
  userId: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  fuelType: VehicleFuelType;
  currentOdometer: number;
  status: VehicleStatus;
  specs: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  costTotal?: number;
}

export interface VehicleListResponse {
  items: Vehicle[];
  total: number;
  page: number;
  limit: number;
}

export type TaskType =
  | 'oil' | 'brakes' | 'tires' | 'itv' | 'inspection' | 'filter' | 'other';
export type TaskStatus = 'upcoming' | 'due' | 'overdue' | 'done';

export interface MaintenanceTask {
  id: string;
  vehicleId: string;
  name: string;
  type: TaskType;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastDoneAt: string | null;
  lastOdometerKm: number | null;
  nextDueKm: number | null;
  nextDueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  plate?: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  taskId: string | null;
  date: string;
  odometer: number;
  cost: number;
  vendor: string | null;
  notes: string | null;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  liters: number;
  cost: number;
  fullTank: boolean;
}

export interface Reminder {
  id: string;
  userId: string;
  vehicleId: string;
  taskId: string;
  dueDate: string;
  type: 'due' | 'overdue';
  acknowledgedAt: string | null;
  taskName?: string;
  plate?: string;
}

export interface DashboardPayload {
  kpis: { active: number; maintenance: number; retired: number };
  alerts: Array<{
    id: string;
    taskId: string;
    vehicleId: string;
    type: 'due' | 'overdue';
    dueDate: string;
    taskName: string;
    plate: string;
    acknowledgedAt: string | null;
  }>;
  monthlyCost: { fuel: number; service: number; total: number };
}

export interface VehicleSummary {
  vehicle: Vehicle;
  stats: {
    totalCost: number;
    totalService: number;
    totalFuel: number;
    avgConsumption: number | null;
    taskCount: number;
    serviceCount: number;
    fuelCount: number;
    lastServiceDate: string | null;
  };
  tasks: MaintenanceTask[];
  services: ServiceRecord[];
  fuelLogs: FuelLog[];
}

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

export interface CostsReport {
  byMonth: CostRow[];
  byVehicle: ByVehicleCost[];
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

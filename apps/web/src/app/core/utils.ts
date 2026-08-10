import { TaskStatus } from './models';

export function fmtKm(km: number | null | undefined): string {
  if (km == null) return '—';
  return new Intl.NumberFormat('es-ES').format(km) + ' km';
}

export function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(n);
}

export function fmtLiters(n: number | null | undefined): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(n) + ' L';
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  const date = new Date(d.length <= 10 ? d + 'T12:00:00' : d);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtMonth(m: string): string {
  const [y, mm] = m.split('-');
  const names = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${names[parseInt(mm, 10) - 1]} ${y}`;
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  upcoming: 'Programada',
  due: 'Por vencer',
  overdue: 'Vencida',
  done: 'Completada',
};

export const CATEGORY_LABEL: Record<string, string> = {
  car: 'Coche',
  van: 'Furgoneta',
  truck: 'Camión',
  motorcycle: 'Moto',
  other: 'Otro',
};

export const FUEL_LABEL: Record<string, string> = {
  diesel: 'Diésel',
  petrol: 'Gasolina',
  electric: 'Eléctrico',
  hybrid: 'Híbrido',
  lpg: 'GLP',
};

export const STATUS_VEHICLE_LABEL: Record<string, string> = {
  active: 'Activo',
  maintenance: 'En taller',
  retired: 'De baja',
};

export const TASK_TYPE_LABEL: Record<string, string> = {
  oil: 'Aceite',
  brakes: 'Frenos',
  tires: 'Ruedas',
  itv: 'ITV',
  inspection: 'Inspección',
  filter: 'Filtro',
  other: 'Otro',
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

import {
  computeNextDue,
  computeTaskStatus,
  addMonths,
} from './maintenance-task.entity';

describe('computeNextDue', () => {
  it('calcula nextDueKm a partir del último odómetro + intervalo km', () => {
    const result = computeNextDue({
      intervalKm: 10000,
      intervalMonths: null,
      lastDoneAt: null,
      lastOdometerKm: 77430,
    });
    expect(result.nextDueKm).toBe(87430);
    expect(result.nextDueDate).toBeNull();
  });

  it('calcula nextDueDate sumando meses a la última ejecución', () => {
    const last = new Date('2025-08-01T12:00:00');
    const result = computeNextDue({
      intervalKm: null,
      intervalMonths: 12,
      lastDoneAt: last,
      lastOdometerKm: null,
    });
    expect(result.nextDueDate).toEqual(new Date('2026-08-01T12:00:00'));
    expect(result.nextDueKm).toBeNull();
  });

  it('calcula ambos vencimientos cuando hay dos intervalos', () => {
    const result = computeNextDue({
      intervalKm: 10000,
      intervalMonths: 12,
      lastDoneAt: new Date('2025-08-01T12:00:00'),
      lastOdometerKm: 77430,
    });
    expect(result.nextDueKm).toBe(87430);
    expect(result.nextDueDate).toEqual(new Date('2026-08-01T12:00:00'));
  });
});

describe('computeTaskStatus', () => {
  const now = new Date('2026-08-10T12:00:00');

  it('marca overdue cuando la fecha de vencimiento ya pasó', () => {
    const status = computeTaskStatus(
      {
        nextDueKm: null,
        nextDueDate: new Date('2026-06-10T12:00:00'),
        lastDoneAt: null,
      },
      87430,
      now,
    );
    expect(status).toBe('overdue');
  });

  it('marca overdue cuando el odómetro supera nextDueKm', () => {
    const status = computeTaskStatus(
      {
        nextDueKm: 85000,
        nextDueDate: null,
        lastDoneAt: null,
      },
      87430,
      now,
    );
    expect(status).toBe('overdue');
  });

  it('marca due cuando vence en los próximos 30 días', () => {
    const status = computeTaskStatus(
      {
        nextDueKm: null,
        nextDueDate: new Date('2026-08-25T12:00:00'),
        lastDoneAt: null,
      },
      87430,
      now,
    );
    expect(status).toBe('due');
  });

  it('marca upcoming cuando no vence pronto', () => {
    const status = computeTaskStatus(
      {
        nextDueKm: 91000,
        nextDueDate: new Date('2027-01-01T12:00:00'),
        lastDoneAt: null,
      },
      87430,
      now,
    );
    expect(status).toBe('upcoming');
  });

  it('marca done si se completó hace menos de 30 días y no está vencida', () => {
    const status = computeTaskStatus(
      {
        nextDueKm: 91000,
        nextDueDate: new Date('2027-01-01T12:00:00'),
        lastDoneAt: new Date('2026-07-25T12:00:00'),
      },
      87430,
      now,
    );
    expect(status).toBe('done');
  });
});

describe('addMonths', () => {
  it('suma meses correctamente cruzando de año', () => {
    const d = addMonths(new Date('2025-11-15T12:00:00'), 3);
    expect(d).toEqual(new Date('2026-02-15T12:00:00'));
  });
});

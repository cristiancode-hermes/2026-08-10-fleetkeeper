import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { FuelLog, Vehicle } from '../../core/models';
import { fmtKm, fmtMoney, fmtLiters, fmtDate } from '../../core/utils';
import { ErrorBannerComponent, EmptyStateComponent } from '../../shared/ui';

@Component({
  selector: 'app-fuel',
  standalone: true,
  imports: [NgFor, NgIf, ErrorBannerComponent, EmptyStateComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>Repostajes</h1>
        <p>{{ logs().length }} registros de combustible.</p>
      </div>
      <a class="btn btn-secondary" [href]="api.csvUrl('/fuel-logs/export')">⬇ Export CSV</a>
    </div>

    <app-error-banner [message]="error()" (retry)="load()" *ngIf="error()"></app-error-banner>

    <div class="filters">
      <select (change)="vehicleId.set($any($event.target).value); load()">
        <option value="">Vehículo: todos</option>
        <option *ngFor="let v of vehicles()" [value]="v.id">{{ v.plate }} — {{ v.make }} {{ v.model }}</option>
      </select>
    </div>

    <div class="table-wrap" *ngIf="!loading(); else sk">
      <table *ngIf="logs().length > 0">
        <thead>
          <tr><th>Fecha</th><th>Matrícula</th><th class="num">Odómetro</th><th class="num">Litros</th><th class="num">Coste</th><th>Tanque lleno</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let l of logs()">
            <td>{{ fmtDate(l.date) }}</td>
            <td><span class="mono">{{ plateOf(l.vehicleId) }}</span></td>
            <td class="num">{{ fmtKm(l.odometer) }}</td>
            <td class="num">{{ fmtLiters(l.liters) }}</td>
            <td class="num">{{ fmtMoney(l.cost) }}</td>
            <td>{{ l.fullTank ? '✓' : '—' }}</td>
          </tr>
        </tbody>
      </table>
      <app-empty-state *ngIf="logs().length === 0" icon="⛽" title="Sin repostajes" copy="Registra repostajes desde la ficha de un vehículo."></app-empty-state>
    </div>

    <ng-template #sk><div class="skeleton sk-card"></div></ng-template>
  `,
})
export class FuelPage {
  api = inject(ApiService);
  logs = signal<FuelLog[]>([]);
  vehicles = signal<Vehicle[]>([]);
  vehicleId = signal('');
  loading = signal(true);
  error = signal('');

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const [logs, vehicles] = await Promise.all([
        this.api.get<FuelLog[]>('/fuel-logs', { vehicleId: this.vehicleId() }),
        this.api.get<{ items: Vehicle[] }>('/vehicles', { limit: 100 }),
      ]);
      this.logs.set(logs);
      this.vehicles.set(vehicles.items);
    } catch {
      this.error.set('No se pudieron cargar los repostajes');
    } finally {
      this.loading.set(false);
    }
  }

  plateOf(id: string): string {
    return this.vehicles().find((v) => v.id === id)?.plate ?? '—';
  }

  fmtKm = fmtKm;
  fmtMoney = fmtMoney;
  fmtLiters = fmtLiters;
  fmtDate = fmtDate;
}

import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { ByVehicleCost, CostsReport, EfficiencyReport, Vehicle } from '../../core/models';
import { fmtMoney, fmtMonth } from '../../core/utils';
import { CostBarChartComponent, EfficiencyChartComponent } from '../../shared/charts';
import { ErrorBannerComponent, EmptyStateComponent } from '../../shared/ui';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [NgFor, NgIf, CostBarChartComponent, EfficiencyChartComponent, ErrorBannerComponent, EmptyStateComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>Reportes</h1>
        <p>Costes por mes y consumo por vehículo.</p>
      </div>
    </div>

    <app-error-banner [message]="error()" (retry)="load()" *ngIf="error()"></app-error-banner>

    <div class="filters">
      <select (change)="vehicleId.set($any($event.target).value); load()">
        <option value="">Vehículo: todos</option>
        <option *ngFor="let v of vehicles()" [value]="v.id">{{ v.plate }} — {{ v.make }} {{ v.model }}</option>
      </select>
    </div>

    <div class="grid grid-2" *ngIf="!loading(); else sk">
      <div class="card">
        <div class="card-head"><span class="card-title">Coste por mes</span></div>
        <app-cost-bar-chart [data]="costs().byMonth"></app-cost-bar-chart>
      </div>

      <div class="card">
        <div class="card-head"><span class="card-title">Consumo (l/100km)</span></div>
        <app-efficiency-chart [entries]="effEntries()"></app-efficiency-chart>
        <p class="muted" style="font-size:.85rem;margin-top:8px" *ngIf="effAvg() != null">
          Media: <strong class="mono">{{ effAvg() }} L/100km</strong>
        </p>
      </div>
    </div>

    <div class="card" style="margin-top:16px" *ngIf="!loading()">
      <div class="card-head"><span class="card-title">Coste por vehículo</span></div>
      <div class="table-wrap" *ngIf="costs().byVehicle.length > 0">
        <table>
          <thead><tr><th>Matrícula</th><th class="num">Combustible</th><th class="num">Talleres</th><th class="num">Total</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of costs().byVehicle">
              <td><span class="mono" style="font-weight:600">{{ v.plate }}</span></td>
              <td class="num">{{ fmtMoney(v.fuel) }}</td>
              <td class="num">{{ fmtMoney(v.service) }}</td>
              <td class="num" style="font-weight:600">{{ fmtMoney(v.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <app-empty-state *ngIf="costs().byVehicle.length === 0" icon="📊" title="Sin datos en el periodo" copy="Registra servicios y repostajes para ver métricas."></app-empty-state>
    </div>

    <ng-template #sk><div class="skeleton sk-card"></div></ng-template>
  `,
})
export class ReportsPage {
  private api = inject(ApiService);
  costs = signal<CostsReport>({ byMonth: [], byVehicle: [] });
  eff = signal<EfficiencyReport[]>([]);
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
      const [costs, eff, vres] = await Promise.all([
        this.api.get<CostsReport>('/reports/costs', { vehicleId: this.vehicleId() }),
        this.api.get<EfficiencyReport[]>('/reports/efficiency', { vehicleId: this.vehicleId() }),
        this.api.get<{ items: Vehicle[] }>('/vehicles', { limit: 100 }),
      ]);
      this.costs.set(costs);
      this.eff.set(eff);
      this.vehicles.set(vres.items);
    } catch {
      this.error.set('No se pudieron cargar los reportes');
    } finally {
      this.loading.set(false);
    }
  }

  effEntries(): EfficiencyReport['entries'] {
    const target = this.vehicleId()
      ? this.eff().filter((e) => e.vehicleId === this.vehicleId())
      : this.eff();
    return target.flatMap((e) => e.entries).slice(-10);
  }
  effAvg(): number | null {
    const target = this.vehicleId()
      ? this.eff().filter((e) => e.vehicleId === this.vehicleId())
      : this.eff();
    const avgs = target.map((e) => e.avg).filter((a): a is number => a != null);
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((s, a) => s + a, 0) / avgs.length) * 10) / 10;
  }

  fmtMoney = fmtMoney;
  fmtMonth = fmtMonth;
}

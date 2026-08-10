import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { DashboardPayload, Reminder } from '../../core/models';
import { fmtKm, fmtMoney, fmtDate, STATUS_LABEL } from '../../core/utils';
import { KpiCardComponent } from '../../shared/kpi-card';
import { TaskBadgeComponent } from '../../shared/badge';
import { CostBarChartComponent } from '../../shared/charts';
import { ErrorBannerComponent, EmptyStateComponent } from '../../shared/ui';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgFor, NgIf, RouterLink,
    KpiCardComponent, TaskBadgeComponent, CostBarChartComponent,
    ErrorBannerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="page-head">
      <div>
        <h1>Panel de flota</h1>
        <p>Estado general, alertas y coste del mes.</p>
      </div>
      <a routerLink="/vehicles/new" class="btn btn-primary">+ Añadir vehículo</a>
    </div>

    <app-error-banner [message]="error()" (retry)="load()" *ngIf="error()"></app-error-banner>

    <div class="grid grid-kpis" *ngIf="!loading(); else sk">
      <app-kpi-card label="Activos" [value]="str(data()?.kpis?.active ?? 0)" tone="success"></app-kpi-card>
      <app-kpi-card label="En taller" [value]="str(data()?.kpis?.maintenance ?? 0)" tone="warning"></app-kpi-card>
      <app-kpi-card label="De baja" [value]="str(data()?.kpis?.retired ?? 0)"></app-kpi-card>
      <app-kpi-card label="Coste del mes" [value]="fmtMoney(data()?.monthlyCost?.total)" sub="combustible + talleres" tone="default"></app-kpi-card>
    </div>

    <ng-template #sk>
      <div class="grid grid-kpis">
        <div class="skeleton sk-card" *ngFor="let i of [1,2,3,4]"></div>
      </div>
    </ng-template>

    <div class="grid grid-2" style="margin-top:16px">
      <div class="card">
        <div class="card-head">
          <span class="card-title">Alertas de mantenimiento</span>
          <a routerLink="/tasks" class="faint" style="font-size:.8rem">Ver todas →</a>
        </div>
        <div class="alert-list" *ngIf="alerts().length > 0">
          <div class="alert-row" [class.alert-overdue]="a.type === 'overdue'" [class.alert-due]="a.type === 'due'" *ngFor="let a of alerts()">
            <span class="badge" [class.badge-danger]="a.type === 'overdue'" [class.badge-warning]="a.type === 'due'">
              {{ a.type === 'overdue' ? 'Vencida' : 'Por vencer' }}
            </span>
            <div class="alert-main">
              <div class="alert-title">{{ a.taskName }}</div>
              <div class="alert-sub mono">{{ a.plate }} · vence {{ fmtDate(a.dueDate) }}</div>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="ack(a.id)">OK</button>
          </div>
        </div>
        <app-empty-state *ngIf="!loading() && alerts().length === 0" icon="✅" title="Sin alertas"
          copy="No hay tareas por vencer. Todo al día."></app-empty-state>
      </div>

      <div class="card">
        <div class="card-head"><span class="card-title">Coste por mes</span></div>
        <app-cost-bar-chart [data]="costs()"></app-cost-bar-chart>
      </div>
    </div>
  `,
})
export class DashboardPage {
  private api = inject(ApiService);
  data = signal<DashboardPayload | null>(null);
  costs = signal<{ month: string; fuel: number; service: number; total: number }[]>([]);
  alerts = signal<DashboardPayload['alerts']>([]);
  loading = signal(true);
  error = signal('');

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const dash = await this.api.get<DashboardPayload>('/vehicles/dashboard');
      this.data.set(dash);
      this.alerts.set(dash.alerts ?? []);
      const costs = await this.api.get<{ byMonth: { month: string; fuel: number; service: number; total: number }[] }>('/reports/costs');
      this.costs.set(costs.byMonth.slice(-6));
    } catch {
      this.error.set('No se pudo cargar el panel');
    } finally {
      this.loading.set(false);
    }
  }

  async ack(id: string): Promise<void> {
    try {
      await this.api.patch<Reminder>(`/reminders/${id}/ack`, {});
      this.alerts.set(this.alerts().filter((a) => a.id !== id));
    } catch {
      this.error.set('No se pudo acusar la alerta');
    }
  }

  fmtKm = fmtKm;
  fmtMoney = fmtMoney;
  fmtDate = fmtDate;
  STATUS_LABEL = STATUS_LABEL;
  str = String;
}

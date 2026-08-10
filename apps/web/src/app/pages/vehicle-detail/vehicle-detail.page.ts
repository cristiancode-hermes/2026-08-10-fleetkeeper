import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { FuelLog, MaintenanceTask, ServiceRecord, VehicleSummary } from '../../core/models';
import { fmtKm, fmtMoney, fmtLiters, fmtDate, TASK_TYPE_LABEL, CATEGORY_LABEL, FUEL_LABEL, todayIso } from '../../core/utils';
import { TaskBadgeComponent, VehicleBadgeComponent } from '../../shared/badge';
import { ErrorBannerComponent, EmptyStateComponent, ModalComponent } from '../../shared/ui';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, FormsModule, TaskBadgeComponent, VehicleBadgeComponent, ErrorBannerComponent, EmptyStateComponent, ModalComponent],
  template: `
    <div class="page-head">
      <div class="vehicle-header">
        <a routerLink="/vehicles" class="btn btn-secondary">←</a>
        <span class="vehicle-plate">{{ data()?.vehicle?.plate }}</span>
        <h1 style="margin:0">{{ data()?.vehicle?.make }} {{ data()?.vehicle?.model }}</h1>
        <app-vehicle-badge [status]="data()?.vehicle?.status ?? 'active'"></app-vehicle-badge>
      </div>
      <div class="vehicle-actions">
        <a [routerLink]="['/vehicles', data()?.vehicle?.id, 'edit']" class="btn btn-secondary">Editar</a>
        <button class="btn btn-danger" (click)="remove()">Retirar</button>
      </div>
    </div>

    <app-error-banner [message]="error()" (retry)="load()" *ngIf="error()"></app-error-banner>

    <ng-container *ngIf="data(); else sk">
      <div class="stat-grid" style="margin-bottom:16px">
        <div class="stat"><div class="stat-label">Odómetro</div><div class="stat-value">{{ fmtKm(d.vehicle.currentOdometer) }}</div></div>
        <div class="stat"><div class="stat-label">Coste total</div><div class="stat-value">{{ fmtMoney(d.stats.totalCost) }}</div></div>
        <div class="stat"><div class="stat-label">Consumo medio</div><div class="stat-value">{{ d.stats.avgConsumption != null ? d.stats.avgConsumption + ' L/100km' : '—' }}</div></div>
        <div class="stat"><div class="stat-label">Tareas</div><div class="stat-value">{{ d.stats.taskCount }}</div></div>
        <div class="stat"><div class="stat-label">Servicios</div><div class="stat-value">{{ d.stats.serviceCount }}</div></div>
        <div class="stat"><div class="stat-label">Repostajes</div><div class="stat-value">{{ d.stats.fuelCount }}</div></div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-head">
          <span class="card-title">Tareas de mantenimiento</span>
          <button class="btn btn-primary btn-sm" (click)="openTask()">+ Nueva tarea</button>
        </div>
        <div class="table-wrap" *ngIf="d.tasks.length > 0">
          <table>
            <thead><tr><th>Tarea</th><th>Tipo</th><th>Intervalo</th><th>Vence (km)</th><th>Vence (fecha)</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let t of d.tasks">
                <td style="font-weight:600">{{ t.name }}</td>
                <td>{{ TASK_TYPE_LABEL[t.type] ?? t.type }}</td>
                <td class="mono">{{ t.intervalKm ? t.intervalKm + ' km' : '' }}{{ t.intervalKm && t.intervalMonths ? ' / ' : '' }}{{ t.intervalMonths ? t.intervalMonths + ' meses' : '' }}</td>
                <td class="num">{{ t.nextDueKm != null ? fmtKm(t.nextDueKm) : '—' }}</td>
                <td class="num">{{ fmtDate(t.nextDueDate) }}</td>
                <td><app-task-badge [status]="t.status"></app-task-badge></td>
                <td>
                  <button class="btn btn-secondary btn-sm" (click)="openService(t)">Completar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-empty-state *ngIf="d.tasks.length === 0" icon="🔧" title="Sin tareas" copy="Define tareas recurrentes (aceite, ITV, frenos…) para recibir avisos." actionLabel="Nueva tarea" (action)="openTask()"></app-empty-state>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <div class="card-head">
            <span class="card-title">Historial de servicios</span>
            <button class="btn btn-primary btn-sm" (click)="openService()">+ Registrar</button>
          </div>
          <div class="table-wrap" *ngIf="d.services.length > 0">
            <table>
              <thead><tr><th>Fecha</th><th class="num">Odómetro</th><th class="num">Coste</th><th>Taller</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of d.services">
                  <td>{{ fmtDate(s.date) }}</td><td class="num">{{ fmtKm(s.odometer) }}</td>
                  <td class="num">{{ fmtMoney(s.cost) }}</td><td>{{ s.vendor ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <app-empty-state *ngIf="d.services.length === 0" icon="🛠️" title="Sin servicios" copy="Registra intervenciones del taller." actionLabel="Registrar servicio" (action)="openService()"></app-empty-state>
        </div>

        <div class="card">
          <div class="card-head">
            <span class="card-title">Repostajes</span>
            <button class="btn btn-primary btn-sm" (click)="openFuel()">+ Registrar</button>
          </div>
          <div class="table-wrap" *ngIf="d.fuelLogs.length > 0">
            <table>
              <thead><tr><th>Fecha</th><th class="num">Odómetro</th><th class="num">Litros</th><th class="num">Coste</th><th>Lleno</th></tr></thead>
              <tbody>
                <tr *ngFor="let fl of d.fuelLogs">
                  <td>{{ fmtDate(fl.date) }}</td><td class="num">{{ fmtKm(fl.odometer) }}</td>
                  <td class="num">{{ fmtLiters(fl.liters) }}</td><td class="num">{{ fmtMoney(fl.cost) }}</td>
                  <td>{{ fl.fullTank ? '✓' : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <app-empty-state *ngIf="d.fuelLogs.length === 0" icon="⛽" title="Sin repostajes" copy="Registra repostajes para calcular el consumo real." actionLabel="Registrar repostaje" (action)="openFuel()"></app-empty-state>
        </div>
      </div>
    </ng-container>

    <ng-template #sk><div class="skeleton sk-card"></div></ng-template>

    <!-- Modal tarea -->
    <app-modal *ngIf="taskModal" title="Nueva tarea" (closed)="taskModal = false">
      <form (ngSubmit)="saveTask()" #tf="ngForm">
        <div class="form-row">
          <label>Nombre *</label>
          <input name="tname" [(ngModel)]="taskForm.name" required maxlength="120" placeholder="Cambio de aceite" />
        </div>
        <div class="form-grid">
          <div class="form-row">
            <label>Tipo</label>
            <select name="ttype" [(ngModel)]="taskForm.type">
              <option *ngFor="let t of taskTypes" [value]="t">{{ TASK_TYPE_LABEL[t] }}</option>
            </select>
          </div>
          <div class="form-row">
            <label>Intervalo km</label>
            <input name="tkm" type="number" class="mono" [(ngModel)]="taskForm.intervalKm" min="1" />
          </div>
          <div class="form-row">
            <label>Intervalo meses</label>
            <input name="tmonths" type="number" class="mono" [(ngModel)]="taskForm.intervalMonths" min="1" />
          </div>
          <div class="form-row">
            <label>Última ejecución (km)</label>
            <input name="tlkm" type="number" class="mono" [(ngModel)]="taskForm.lastOdometerKm" min="0" />
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="taskModal = false">Cancelar</button>
          <button class="btn btn-primary" type="submit" [disabled]="tf.invalid">Crear tarea</button>
        </div>
      </form>
    </app-modal>

    <!-- Modal servicio -->
    <app-modal *ngIf="serviceModal" [title]="serviceForm.taskId ? 'Completar tarea' : 'Registrar servicio'" (closed)="serviceModal = false">
      <form (ngSubmit)="saveService()" #sf="ngForm">
        <div class="form-row" *ngIf="d && d.tasks.length > 0">
          <label>Tarea asociada (opcional)</label>
          <select name="stask" [(ngModel)]="serviceForm.taskId">
            <option value="">— Sin tarea —</option>
            <option *ngFor="let t of d.tasks" [value]="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="form-grid">
          <div class="form-row"><label>Fecha *</label><input name="sdate" type="date" [(ngModel)]="serviceForm.date" required /></div>
          <div class="form-row"><label>Odómetro *</label><input name="sodo" type="number" class="mono" [(ngModel)]="serviceForm.odometer" required min="0" /></div>
          <div class="form-row"><label>Coste (€)</label><input name="scost" type="number" step="0.01" class="mono" [(ngModel)]="serviceForm.cost" min="0" /></div>
          <div class="form-row"><label>Taller</label><input name="svendor" [(ngModel)]="serviceForm.vendor" maxlength="120" /></div>
        </div>
        <div class="form-row"><label>Notas</label><textarea name="snotes" rows="2" [(ngModel)]="serviceForm.notes"></textarea></div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="serviceModal = false">Cancelar</button>
          <button class="btn btn-primary" type="submit" [disabled]="sf.invalid">Guardar</button>
        </div>
      </form>
    </app-modal>

    <!-- Modal repostaje -->
    <app-modal *ngIf="fuelModal" title="Registrar repostaje" (closed)="fuelModal = false">
      <form (ngSubmit)="saveFuel()" #ff="ngForm">
        <div class="form-grid">
          <div class="form-row"><label>Fecha *</label><input name="fdate" type="date" [(ngModel)]="fuelForm.date" required /></div>
          <div class="form-row"><label>Odómetro *</label><input name="fodo" type="number" class="mono" [(ngModel)]="fuelForm.odometer" required min="0" /></div>
          <div class="form-row"><label>Litros *</label><input name="fliters" type="number" step="0.01" class="mono" [(ngModel)]="fuelForm.liters" required min="0" /></div>
          <div class="form-row"><label>Coste (€) *</label><input name="fcost" type="number" step="0.01" class="mono" [(ngModel)]="fuelForm.cost" required min="0" /></div>
        </div>
        <div class="form-row">
          <label style="display:flex;align-items:center;gap:8px;font-weight:500">
            <input type="checkbox" name="ffull" [(ngModel)]="fuelForm.fullTank" style="width:auto" /> Tanque lleno
          </label>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="fuelModal = false">Cancelar</button>
          <button class="btn btn-primary" type="submit" [disabled]="ff.invalid">Guardar</button>
        </div>
      </form>
    </app-modal>
  `,
})
export class VehicleDetailPage {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  data = signal<VehicleSummary | null>(null);
  error = signal('');
  loading = signal(true);

  taskModal = false;
  serviceModal = false;
  fuelModal = false;

  taskTypes = ['oil', 'brakes', 'tires', 'itv', 'inspection', 'filter', 'other'];
  taskForm = { name: '', type: 'oil', intervalKm: null as number | null, intervalMonths: null as number | null, lastOdometerKm: null as number | null };
  serviceForm = { taskId: '', date: todayIso(), odometer: 0, cost: 0, vendor: '', notes: '' };
  fuelForm = { date: todayIso(), odometer: 0, liters: 0, cost: 0, fullTank: true };

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const s = await this.api.get<VehicleSummary>(`/vehicles/${id}/summary`);
      this.data.set(s);
      this.fuelForm.odometer = s.vehicle.currentOdometer;
      this.serviceForm.odometer = s.vehicle.currentOdometer;
    } catch {
      this.error.set('Vehículo no encontrado');
    } finally {
      this.loading.set(false);
    }
  }

  openTask(): void {
    this.taskForm = { name: '', type: 'oil', intervalKm: null, intervalMonths: null, lastOdometerKm: this.data()?.vehicle.currentOdometer ?? null };
    this.taskModal = true;
  }
  openService(task?: MaintenanceTask): void {
    this.serviceForm = { taskId: task?.id ?? '', date: todayIso(), odometer: this.data()?.vehicle.currentOdometer ?? 0, cost: 0, vendor: '', notes: '' };
    this.serviceModal = true;
  }
  openFuel(): void {
    this.fuelForm = { date: todayIso(), odometer: this.data()?.vehicle.currentOdometer ?? 0, liters: 0, cost: 0, fullTank: true };
    this.fuelModal = true;
  }

  async saveTask(): Promise<void> {
    const v = this.data()!.vehicle;
    try {
      await this.api.post<MaintenanceTask>('/tasks', {
        vehicleId: v.id,
        name: this.taskForm.name,
        type: this.taskForm.type,
        intervalKm: this.taskForm.intervalKm,
        intervalMonths: this.taskForm.intervalMonths,
        lastOdometerKm: this.taskForm.lastOdometerKm,
      });
      this.taskModal = false;
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo crear la tarea');
    }
  }

  async saveService(): Promise<void> {
    const v = this.data()!.vehicle;
    const hasTask = !!this.serviceForm.taskId;
    try {
      if (hasTask) {
        await this.api.patch<{ task: MaintenanceTask; serviceRecord: ServiceRecord }>(
          `/tasks/${this.serviceForm.taskId}/complete`,
          {
            date: this.serviceForm.date,
            odometer: Number(this.serviceForm.odometer),
            cost: Number(this.serviceForm.cost || 0),
            vendor: this.serviceForm.vendor || undefined,
            notes: this.serviceForm.notes || undefined,
          },
        );
      } else {
        await this.api.post<ServiceRecord>('/service-records', {
          vehicleId: v.id,
          date: this.serviceForm.date,
          odometer: Number(this.serviceForm.odometer),
          cost: Number(this.serviceForm.cost || 0),
          vendor: this.serviceForm.vendor || undefined,
          notes: this.serviceForm.notes || undefined,
        });
      }
      this.serviceModal = false;
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo guardar el servicio');
    }
  }

  async saveFuel(): Promise<void> {
    const v = this.data()!.vehicle;
    try {
      await this.api.post<FuelLog>('/fuel-logs', {
        vehicleId: v.id,
        date: this.fuelForm.date,
        odometer: Number(this.fuelForm.odometer),
        liters: Number(this.fuelForm.liters),
        cost: Number(this.fuelForm.cost),
        fullTank: this.fuelForm.fullTank,
      });
      this.fuelModal = false;
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'No se pudo guardar el repostaje');
    }
  }

  async remove(): Promise<void> {
    const v = this.data()?.vehicle;
    if (!v) return;
    if (!confirm(`¿Retirar ${v.plate}? Se eliminará el vehículo y su histórico.`)) return;
    try {
      await this.api.delete(`/vehicles/${v.id}`);
      this.router.navigate(['/vehicles']);
    } catch {
      this.error.set('No se pudo retirar el vehículo');
    }
  }

  get d(): VehicleSummary {
    return this.data()!;
  }
  fmtKm = fmtKm;
  fmtMoney = fmtMoney;
  fmtLiters = fmtLiters;
  fmtDate = fmtDate;
  TASK_TYPE_LABEL = TASK_TYPE_LABEL;
  CATEGORY_LABEL = CATEGORY_LABEL;
  FUEL_LABEL = FUEL_LABEL;
}

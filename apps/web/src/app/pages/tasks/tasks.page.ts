import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { MaintenanceTask } from '../../core/models';
import { fmtKm, fmtDate, TASK_TYPE_LABEL } from '../../core/utils';
import { TaskBadgeComponent } from '../../shared/badge';
import { ErrorBannerComponent, EmptyStateComponent } from '../../shared/ui';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, TaskBadgeComponent, ErrorBannerComponent, EmptyStateComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>Tareas de mantenimiento</h1>
        <p>{{ tasks().length }} tareas en la flota.</p>
      </div>
      <a routerLink="/vehicles" class="btn btn-primary">+ Nueva tarea</a>
    </div>

    <app-error-banner [message]="error()" (retry)="load()" *ngIf="error()"></app-error-banner>

    <div class="filters">
      <select (change)="status.set($any($event.target).value); load()">
        <option value="">Estado: todos</option>
        <option value="overdue">Vencidas</option>
        <option value="due">Por vencer</option>
        <option value="upcoming">Programadas</option>
        <option value="done">Completadas</option>
      </select>
      <select (change)="type.set($any($event.target).value); load()">
        <option value="">Tipo: todos</option>
        <option *ngFor="let t of taskTypes" [value]="t">{{ TASK_TYPE_LABEL[t] }}</option>
      </select>
    </div>

    <div class="table-wrap" *ngIf="!loading(); else sk">
      <table *ngIf="tasks().length > 0">
        <thead>
          <tr><th>Tarea</th><th>Tipo</th><th>Matrícula</th><th>Vence (km)</th><th>Vence (fecha)</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of tasks()">
            <td style="font-weight:600"><a [routerLink]="['/vehicles', t.vehicleId]">{{ t.name }}</a></td>
            <td>{{ TASK_TYPE_LABEL[t.type] ?? t.type }}</td>
            <td><span class="mono">{{ t.plate }}</span></td>
            <td class="num">{{ t.nextDueKm != null ? fmtKm(t.nextDueKm) : '—' }}</td>
            <td class="num">{{ fmtDate(t.nextDueDate) }}</td>
            <td><app-task-badge [status]="t.status"></app-task-badge></td>
            <td>
              <button *ngIf="t.status !== 'done'" class="btn btn-secondary btn-sm" [routerLink]="['/vehicles', t.vehicleId]">Completar</button>
            </td>
          </tr>
        </tbody>
      </table>
      <app-empty-state *ngIf="tasks().length === 0" icon="🔧" title="Sin tareas" copy="Crea tareas desde la ficha de un vehículo." actionLabel="Ir a vehículos" (action)="goVehicles()"></app-empty-state>
    </div>

    <ng-template #sk><div class="skeleton sk-card"></div></ng-template>
  `,
})
export class TasksPage {
  private api = inject(ApiService);
  tasks = signal<MaintenanceTask[]>([]);
  status = signal('');
  type = signal('');
  loading = signal(true);
  error = signal('');
  taskTypes = ['oil', 'brakes', 'tires', 'itv', 'inspection', 'filter', 'other'];

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const tasks = await this.api.get<MaintenanceTask[]>('/tasks', {
        status: this.status(),
        type: this.type(),
      });
      this.tasks.set(tasks);
    } catch {
      this.error.set('No se pudieron cargar las tareas');
    } finally {
      this.loading.set(false);
    }
  }

  goVehicles(): void {
    window.location.href = '/vehicles';
  }

  fmtKm = fmtKm;
  fmtDate = fmtDate;
  TASK_TYPE_LABEL = TASK_TYPE_LABEL;
}

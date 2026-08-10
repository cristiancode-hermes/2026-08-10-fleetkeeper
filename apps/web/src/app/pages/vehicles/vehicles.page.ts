import { Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Vehicle, VehicleListResponse } from '../../core/models';
import { fmtKm, fmtMoney, CATEGORY_LABEL, FUEL_LABEL, STATUS_VEHICLE_LABEL } from '../../core/utils';
import { VehicleBadgeComponent } from '../../shared/badge';
import { ErrorBannerComponent, EmptyStateComponent, PaginationComponent } from '../../shared/ui';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, VehicleBadgeComponent, ErrorBannerComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <div class="page-head">
      <div>
        <h1>Vehículos</h1>
        <p>{{ total() }} vehículos en la flota.</p>
      </div>
      <a routerLink="/vehicles/new" class="btn btn-primary">+ Añadir vehículo</a>
    </div>

    <app-error-banner [message]="error()" (retry)="load()" *ngIf="error()"></app-error-banner>

    <div class="filters">
      <input class="search" type="search" placeholder="Buscar matrícula, marca, modelo…" (input)="onSearch($event)" />
      <select (change)="status.set($any($event.target).value); load()">
        <option value="">Estado: todos</option>
        <option value="active">Activo</option>
        <option value="maintenance">En taller</option>
        <option value="retired">De baja</option>
      </select>
      <select (change)="category.set($any($event.target).value); load()">
        <option value="">Categoría: todas</option>
        <option *ngFor="let c of ['car','van','truck','motorcycle','other']" [value]="c">{{ CATEGORY_LABEL[c] }}</option>
      </select>
    </div>

    <div class="table-wrap" *ngIf="!loading(); else sk">
      <table *ngIf="items().length > 0">
        <thead>
          <tr>
            <th>Matrícula</th><th>Vehículo</th><th>Año</th><th>Categoría</th>
            <th>Combustible</th><th class="num">Odómetro</th><th class="num">Coste total</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr class="clickable" *ngFor="let v of items()" [routerLink]="['/vehicles', v.id]">
            <td><span class="mono" style="font-weight:600">{{ v.plate }}</span></td>
            <td>{{ v.make }} {{ v.model }}</td>
            <td class="mono">{{ v.year }}</td>
            <td>{{ CATEGORY_LABEL[v.category] ?? v.category }}</td>
            <td>{{ FUEL_LABEL[v.fuelType] ?? v.fuelType }}</td>
            <td class="num">{{ fmtKm(v.currentOdometer) }}</td>
            <td class="num">{{ fmtMoney(v.costTotal) }}</td>
            <td><app-vehicle-badge [status]="v.status"></app-vehicle-badge></td>
          </tr>
        </tbody>
      </table>
      <app-empty-state *ngIf="items().length === 0" icon="🚚" title="Sin vehículos todavía"
        copy="Añade tu primer vehículo para empezar a planificar mantenimientos."
        actionLabel="Añadir vehículo" (action)="goNew()"></app-empty-state>
    </div>

    <ng-template #sk>
      <div class="card"><div class="skeleton sk-line" style="width:60%"></div><div class="skeleton sk-line"></div><div class="skeleton sk-line"></div><div class="skeleton sk-line" style="width:80%"></div></div>
    </ng-template>

    <app-pagination [page]="page()" [total]="total()" [limit]="limit()" (pageChange)="page.set($event); load()"></app-pagination>
  `,
})
export class VehiclesPage {
  private api = inject(ApiService);
  items = signal<Vehicle[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  search = signal('');
  status = signal('');
  category = signal('');
  loading = signal(true);
  error = signal('');
  private timer: any;

  constructor() {
    this.load();
  }

  debounced(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.load(), 300);
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.api.get<VehicleListResponse>('/vehicles', {
        search: this.search(),
        status: this.status(),
        category: this.category(),
        page: this.page(),
        limit: this.limit(),
      });
      this.items.set(res.items);
      this.total.set(res.total);
    } catch {
      this.error.set('No se pudieron cargar los vehículos');
    } finally {
      this.loading.set(false);
    }
  }

  goNew(): void {
    window.location.href = '/vehicles/new';
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.debounced();
  }

  fmtKm = fmtKm;
  fmtMoney = fmtMoney;
  CATEGORY_LABEL = CATEGORY_LABEL;
  FUEL_LABEL = FUEL_LABEL;
  STATUS_VEHICLE_LABEL = STATUS_VEHICLE_LABEL;
}

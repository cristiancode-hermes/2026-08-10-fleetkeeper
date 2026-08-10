import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Vehicle, VehicleCategory, VehicleFuelType } from '../../core/models';
import { CATEGORY_LABEL, FUEL_LABEL, todayIso } from '../../core/utils';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ editing ? 'Editar vehículo' : 'Nuevo vehículo' }}</h1>
        <p>{{ editing ? 'Actualiza los datos del vehículo.' : 'Registra un vehículo de la flota.' }}</p>
      </div>
      <a routerLink="/vehicles" class="btn btn-secondary">← Volver</a>
    </div>

    <div class="auth-error" *ngIf="error">{{ error }}</div>

    <div class="card" style="max-width:760px">
      <form (ngSubmit)="save()" #f="ngForm">
        <div class="form-grid">
          <div class="form-row">
            <label for="plate">Matrícula *</label>
            <input id="plate" name="plate" type="text" class="mono" [(ngModel)]="form.plate" required minlength="2" maxlength="15" placeholder="2341-FGH" />
          </div>
          <div class="form-row">
            <label for="year">Año *</label>
            <input id="year" name="year" type="number" class="mono" [(ngModel)]="form.year" required min="1950" [max]="maxYear" />
          </div>
          <div class="form-row">
            <label for="make">Marca *</label>
            <input id="make" name="make" type="text" [(ngModel)]="form.make" required maxlength="60" />
          </div>
          <div class="form-row">
            <label for="model">Modelo *</label>
            <input id="model" name="model" type="text" [(ngModel)]="form.model" required maxlength="60" />
          </div>
          <div class="form-row">
            <label for="category">Categoría *</label>
            <select id="category" name="category" [(ngModel)]="form.category" required>
              <option *ngFor="let c of categories" [value]="c">{{ CATEGORY_LABEL[c] }}</option>
            </select>
          </div>
          <div class="form-row">
            <label for="fuelType">Combustible *</label>
            <select id="fuelType" name="fuelType" [(ngModel)]="form.fuelType" required>
              <option *ngFor="let c of fuelTypes" [value]="c">{{ FUEL_LABEL[c] }}</option>
            </select>
          </div>
          <div class="form-row">
            <label for="odometer">Odómetro actual (km)</label>
            <input id="odometer" name="odometer" type="number" class="mono" [(ngModel)]="form.currentOdometer" min="0" inputmode="numeric" />
          </div>
          <div class="form-row" *ngIf="editing">
            <label for="status">Estado</label>
            <select id="status" name="status" [(ngModel)]="form.status">
              <option value="active">Activo</option>
              <option value="maintenance">En taller</option>
              <option value="retired">De baja</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <a routerLink="/vehicles" class="btn btn-secondary">Cancelar</a>
          <button class="btn btn-primary" type="submit" [disabled]="busy || f.invalid">
            {{ busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear vehículo' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class VehicleFormPage {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  editing = false;
  busy = false;
  error = '';
  maxYear = new Date().getFullYear() + 1;
  categories: VehicleCategory[] = ['car', 'van', 'truck', 'motorcycle', 'other'];
  fuelTypes: VehicleFuelType[] = ['diesel', 'petrol', 'electric', 'hybrid', 'lpg'];

  form = {
    plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'car' as VehicleCategory,
    fuelType: 'diesel' as VehicleFuelType,
    currentOdometer: 0,
    status: 'active',
  };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editing = true;
      this.load(id);
    }
  }

  async load(id: string): Promise<void> {
    try {
      const v = await this.api.get<Vehicle>(`/vehicles/${id}`);
      this.form = {
        plate: v.plate,
        make: v.make,
        model: v.model,
        year: v.year,
        category: v.category,
        fuelType: v.fuelType,
        currentOdometer: v.currentOdometer,
        status: v.status,
      };
    } catch {
      this.error = 'Vehículo no encontrado';
    }
  }

  async save(): Promise<void> {
    this.busy = true;
    this.error = '';
    const id = this.route.snapshot.paramMap.get('id');
    const payload = {
      plate: this.form.plate,
      make: this.form.make,
      model: this.form.model,
      year: Number(this.form.year),
      category: this.form.category,
      fuelType: this.form.fuelType,
      currentOdometer: Number(this.form.currentOdometer || 0),
      ...(this.editing ? { status: this.form.status } : {}),
    };
    try {
      if (id) {
        await this.api.patch<Vehicle>(`/vehicles/${id}`, payload);
      } else {
        await this.api.post<Vehicle>('/vehicles', payload);
      }
      this.router.navigate(id ? ['/vehicles', id] : ['/vehicles']);
    } catch (e: any) {
      this.error = e?.error?.message ?? 'No se pudo guardar el vehículo';
    } finally {
      this.busy = false;
    }
  }

  CATEGORY_LABEL = CATEGORY_LABEL;
  FUEL_LABEL = FUEL_LABEL;
  todayIso = todayIso;
}

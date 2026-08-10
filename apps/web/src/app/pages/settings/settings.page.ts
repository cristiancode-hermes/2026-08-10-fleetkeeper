import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ThemeService } from '../../core/theme.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NgIf, FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Ajustes</h1>
        <p>Perfil, tema y exportación de datos.</p>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-head"><span class="card-title">Perfil</span></div>
        <div class="auth-error" *ngIf="error">{{ error }}</div>
        <form (ngSubmit)="saveProfile()" #pf="ngForm">
          <div class="form-row">
            <label>Nombre de usuario</label>
            <input name="u-name" [(ngModel)]="username" required minlength="3" />
          </div>
          <div class="form-row">
            <label>Email</label>
            <input name="u-email" type="email" [(ngModel)]="email" required email />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="pf.invalid || busy">{{ busy ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </form>
        <p class="muted" style="font-size:.85rem">Rol: <strong>{{ auth.currentUser()?.role }}</strong></p>
      </div>

      <div class="card">
        <div class="card-head"><span class="card-title">Tema</span></div>
        <p class="muted" style="margin-top:0">Modo actual: <strong>{{ theme.theme() === 'dark' ? 'Oscuro' : 'Claro' }}</strong></p>
        <button class="btn btn-secondary" (click)="theme.toggle()">
          {{ theme.theme() === 'dark' ? '☀ Cambiar a claro' : '☾ Cambiar a oscuro' }}
        </button>

        <div style="margin-top:24px">
          <div class="card-head"><span class="card-title">Exportar datos</span></div>
          <div class="form-actions" style="justify-content:flex-start">
            <a class="btn btn-secondary" [href]="api.csvUrl('/vehicles/export')">Vehículos CSV</a>
            <a class="btn btn-secondary" [href]="api.csvUrl('/service-records/export')">Servicios CSV</a>
            <a class="btn btn-secondary" [href]="api.csvUrl('/fuel-logs/export')">Repostajes CSV</a>
          </div>
        </div>

        <div style="margin-top:24px">
          <div class="card-head"><span class="card-title">Sesión</span></div>
          <button class="btn btn-danger" (click)="auth.logout()">Cerrar sesión</button>
        </div>
      </div>
    </div>
  `,
})
export class SettingsPage {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  api = inject(ApiService);

  username = this.auth.currentUser()?.username ?? '';
  email = this.auth.currentUser()?.email ?? '';
  busy = false;
  error = '';

  async saveProfile(): Promise<void> {
    this.busy = true;
    this.error = '';
    try {
      await this.auth.updateProfile({ username: this.username.trim(), email: this.email.trim() });
    } catch (e: any) {
      this.error = e?.error?.message ?? 'No se pudo guardar el perfil';
    } finally {
      this.busy = false;
    }
  }
}

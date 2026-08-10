import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, NgIf],
  template: `
    <div class="auth-wrap">
      <div class="card auth-card">
        <div class="auth-logo">
          <span class="brand-mark">FK</span>
          <span class="brand-name">FleetKeeper</span>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab" [class.active]="mode === 'login'" (click)="mode = 'login'">Entrar</button>
          <button class="auth-tab" [class.active]="mode === 'register'" (click)="mode = 'register'">Registrarse</button>
        </div>

        <div class="auth-error" *ngIf="error">{{ error }}</div>

        <form *ngIf="mode === 'login'" (ngSubmit)="doLogin()" #loginForm="ngForm">
          <div class="form-row">
            <label for="identifier">Usuario o email</label>
            <input id="identifier" name="identifier" type="text" [(ngModel)]="identifier" required autocomplete="username" />
          </div>
          <div class="form-row">
            <label for="password">Contraseña</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" required autocomplete="current-password" />
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="busy || loginForm.invalid" style="width:100%">
            {{ busy ? 'Entrando…' : 'Entrar' }}
          </button>
        </form>

        <form *ngIf="mode === 'register'" (ngSubmit)="doRegister()" #regForm="ngForm">
          <div class="form-row">
            <label for="r-username">Nombre de usuario</label>
            <input id="r-username" name="r-username" type="text" [(ngModel)]="username" required minlength="3" autocomplete="username" />
          </div>
          <div class="form-row">
            <label for="r-email">Email</label>
            <input id="r-email" name="r-email" type="email" [(ngModel)]="email" required email autocomplete="email" />
          </div>
          <div class="form-row">
            <label for="r-password">Contraseña</label>
            <input id="r-password" name="r-password" type="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password" />
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="busy || regForm.invalid" style="width:100%">
            {{ busy ? 'Creando cuenta…' : 'Crear cuenta' }}
          </button>
        </form>

        <div class="demo-hint">
          <strong>Cuenta demo:</strong> <span class="mono">demo</span> / <span class="mono">demo1234</span>
        </div>
      </div>
    </div>
  `,
})
export class AuthPage {
  mode: 'login' | 'register' = 'login';
  identifier = '';
  username = '';
  email = '';
  password = '';
  error = '';
  busy = false;

  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  async doLogin(): Promise<void> {
    this.error = '';
    this.busy = true;
    try {
      await this.auth.login(this.identifier.trim(), this.password);
      this.goHome();
    } catch (e: any) {
      this.error = e?.error?.message ?? 'No se pudo iniciar sesión';
    } finally {
      this.busy = false;
    }
  }

  async doRegister(): Promise<void> {
    this.error = '';
    this.busy = true;
    try {
      await this.auth.register(this.username.trim(), this.email.trim(), this.password);
      this.goHome();
    } catch (e: any) {
      this.error = e?.error?.message ?? 'No se pudo crear la cuenta';
    } finally {
      this.busy = false;
    }
  }

  private goHome(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/dashboard');
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIf, NgClass, NgFor } from '@angular/common';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, NgClass, NgFor],
  template: `
    <ng-container *ngIf="auth.isAuthenticated(); else authView">
      <div class="shell">
        <aside class="sidebar">
          <a routerLink="/dashboard" class="brand">
            <span class="brand-mark">FK</span>
            <span class="brand-name">FleetKeeper</span>
          </a>
          <nav class="nav">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item">
              <span class="nav-ic">▦</span> Panel
            </a>
            <a routerLink="/vehicles" routerLinkActive="active" class="nav-item">
              <span class="nav-ic">🚚</span> Vehículos
            </a>
            <a routerLink="/tasks" routerLinkActive="active" class="nav-item">
              <span class="nav-ic">🔧</span> Tareas
            </a>
            <a routerLink="/fuel" routerLinkActive="active" class="nav-item">
              <span class="nav-ic">⛽</span> Repostajes
            </a>
            <a routerLink="/reports" routerLinkActive="active" class="nav-item">
              <span class="nav-ic">📊</span> Reportes
            </a>
          </nav>
          <div class="sidebar-foot">
            <a routerLink="/settings" routerLinkActive="active" class="nav-item">
              <span class="nav-ic">⚙</span> Ajustes
            </a>
          </div>
        </aside>

        <main class="main">
          <header class="topbar">
            <button class="icon-btn" (click)="menuOpen = !menuOpen" aria-label="Menú">
              ☰
            </button>
            <div class="topbar-spacer"></div>
            <button class="icon-btn" (click)="theme.toggle()" [attr.aria-label]="theme.theme() === 'dark' ? 'Modo claro' : 'Modo oscuro'">
              {{ theme.theme() === 'dark' ? '☀' : '☾' }}
            </button>
            <div class="user-chip" (click)="menuOpen = !menuOpen">
              <span class="avatar">{{ initials() }}</span>
              <span class="user-name">{{ auth.currentUser()?.username }}</span>
            </div>
          </header>

          <div class="content">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <nav *ngIf="menuOpen" class="mobile-nav" (click)="menuOpen = false">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item"><span class="nav-ic">▦</span> Panel</a>
        <a routerLink="/vehicles" routerLinkActive="active" class="nav-item"><span class="nav-ic">🚚</span> Vehículos</a>
        <a routerLink="/tasks" routerLinkActive="active" class="nav-item"><span class="nav-ic">🔧</span> Tareas</a>
        <a routerLink="/fuel" routerLinkActive="active" class="nav-item"><span class="nav-ic">⛽</span> Repostajes</a>
        <a routerLink="/reports" routerLinkActive="active" class="nav-item"><span class="nav-ic">📊</span> Reportes</a>
        <a routerLink="/settings" routerLinkActive="active" class="nav-item"><span class="nav-ic">⚙</span> Ajustes</a>
        <button class="btn btn-secondary" (click)="auth.logout()">Cerrar sesión</button>
      </nav>
    </ng-container>

    <ng-template #authView>
      <router-outlet></router-outlet>
    </ng-template>
  `,
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  menuOpen = false;

  ngOnInit(): void {
    this.auth.restore();
  }

  initials(): string {
    const u = this.auth.currentUser();
    if (!u) return '?';
    return u.username.slice(0, 2).toUpperCase();
  }
}

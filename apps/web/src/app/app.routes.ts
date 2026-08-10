import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./pages/vehicles/vehicles.page').then((m) => m.VehiclesPage),
      },
      {
        path: 'vehicles/new',
        loadComponent: () =>
          import('./pages/vehicle-form/vehicle-form.page').then((m) => m.VehicleFormPage),
      },
      {
        path: 'vehicles/:id',
        loadComponent: () =>
          import('./pages/vehicle-detail/vehicle-detail.page').then((m) => m.VehicleDetailPage),
      },
      {
        path: 'vehicles/:id/edit',
        loadComponent: () =>
          import('./pages/vehicle-form/vehicle-form.page').then((m) => m.VehicleFormPage),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./pages/tasks/tasks.page').then((m) => m.TasksPage),
      },
      {
        path: 'fuel',
        loadComponent: () =>
          import('./pages/fuel/fuel.page').then((m) => m.FuelPage),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];

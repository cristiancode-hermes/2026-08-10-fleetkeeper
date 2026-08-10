import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless por defecto (Angular 22 application builder) — sin zone.js
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};

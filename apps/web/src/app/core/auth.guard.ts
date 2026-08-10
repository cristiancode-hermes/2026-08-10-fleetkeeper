import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TOKEN_KEY } from './auth.interceptor';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return true;
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: router.url },
  });
};

export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return true;
  return router.createUrlTree(['/dashboard']);
};

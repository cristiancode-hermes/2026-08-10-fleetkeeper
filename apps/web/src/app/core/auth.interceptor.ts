import { HttpInterceptorFn } from '@angular/common/http';

export const TOKEN_KEY = 'fk-token';

/** Añade Authorization: Bearer <token> a todas las peticiones. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: 'Bearer ' + token },
    });
  }
  return next(req);
};

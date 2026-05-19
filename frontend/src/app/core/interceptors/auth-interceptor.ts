import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Solo adjuntar token a peticiones dirigidas a NUESTRO backend
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  if (isApiRequest) {
    const token = localStorage.getItem('token');

    if (token) {
      // Verificar si el token está expirado antes de enviarlo
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expMs = payload.exp * 1000;
        if (Date.now() >= expMs) {
          // Token expirado: limpiar sesión y redirigir
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!router.url.startsWith('/login')) {
            router.navigate(['/login']);
          }
          return throwError(() => new HttpErrorResponse({
            status: 401,
            statusText: 'Token expirado',
          }));
        }
      } catch {
        // Token malformado: limpiar
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo redirigir a /login si el 401 viene de NUESTRO backend
      if (
        error.status === 401 &&
        isApiRequest &&
        !router.url.startsWith('/login')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

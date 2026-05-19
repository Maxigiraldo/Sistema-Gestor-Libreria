import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Verificar que el token exista Y no esté expirado
  if (auth.isLoggedIn() && !auth.isTokenExpired()) {
    return true;
  }

  // Si el token existe pero está expirado, limpiar sesión sin navegar
  // (la navegación la hace el guard abajo con router.navigate)
  if (auth.isLoggedIn()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  router.navigate(['/login']);
  return false;
};


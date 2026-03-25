import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () =>
      import('./features/auth/login/login')
      .then(m => m.LoginComponent)
  },
  {
  path: 'register',
  loadComponent: () =>
    import('./features/auth/register/register')
    .then(m => m.RegisterComponent)
  },
  {
  path: 'profile',
  loadComponent: () =>
    import('./features/profile/profile/profile')
    .then(m => m.ProfileComponent),
  canActivate: [authGuard]
  },
  {
  path: 'books',
  loadComponent: () =>
    import('./features/books/book-list/book-list')
    .then(m => m.BookList),
  canActivate: [authGuard]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

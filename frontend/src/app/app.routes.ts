import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/books/book-list/book-list')
      .then(m => m.BookListComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
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
    path: 'profile/edit',
    loadComponent: () =>
      import('./features/profile/edit-profile/edit-profile')
      .then(m => m.EditProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-panel/admin-panel')
      .then(m => m.AdminPanelComponent),
    canActivate: [authGuard]  // el guard de rol ROOT lo manejas en el componente
  },
  { path: '**', redirectTo: '' }
];

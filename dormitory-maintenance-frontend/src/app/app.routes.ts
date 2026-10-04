import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard(['student'])],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent), // Placeholder until Phase 2
  },
  {
    path: 'janitor',
    canActivate: [authGuard, roleGuard(['janitor'])],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent), // Placeholder until Phase 3
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent), // Placeholder until Phase 4/5
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];

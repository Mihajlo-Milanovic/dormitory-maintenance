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
    children: [
      {
        path: '',
        loadComponent: () => import('./features/student/report-list.component').then((m) => m.ReportListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./features/student/report-create.component').then((m) => m.ReportCreateComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/student/report-detail.component').then((m) => m.ReportDetailComponent),
      },
    ],
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

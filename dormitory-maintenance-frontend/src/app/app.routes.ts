import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard(['student'])],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/student/report-list/report-list.component').then((m) => m.ReportListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./features/student/report-create/report-create.component').then((m) => m.ReportCreateComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/student/report-detail/report-detail.component').then((m) => m.ReportDetailComponent),
      },
    ],
  },
  {
    path: 'janitor',
    canActivate: [authGuard, roleGuard(['janitor'])],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/janitor/janitor-feed/janitor-feed.component').then((m) => m.JanitorFeedComponent),
      },
      {
        path: 'my-jobs',
        loadComponent: () => import('./features/janitor/my-jobs/my-jobs.component').then((m) => m.MyJobsComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/janitor/job-detail/job-detail.component').then((m) => m.JobDetailComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent), // Placeholder until Phase 4/5
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

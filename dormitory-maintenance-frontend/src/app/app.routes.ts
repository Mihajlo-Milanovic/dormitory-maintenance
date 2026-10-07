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
    canActivate: [authGuard, roleGuard(['administrator'])],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'supplies',
        pathMatch: 'full',
      },
      {
        path: 'supplies',
        loadComponent: () => import('./features/admin/supply-queue/supply-queue.component').then((m) => m.SupplyQueueComponent),
      },
      {
        path: 'reassignment',
        loadComponent: () => import('./features/admin/reassignment/reassignment.component').then((m) => m.ReassignmentComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/user-management/user-management.component').then((m) => m.UserManagementComponent),
      },
    ],
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

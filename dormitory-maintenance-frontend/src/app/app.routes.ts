import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'admin',
    title: 'Administrator',
    canActivate: [authGuard, roleGuard(['administrator'])],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
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
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'student',
    title: 'Student',
    canActivate: [authGuard, roleGuard(['student'])],
    children: [
      {
        path: 'new',
        loadComponent: () => import('./features/student/report-create/report-create.component').then((m) => m.ReportCreateComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/student/report-detail/report-detail.component').then((m) => m.ReportDetailComponent),
      },
      {
        path: '',
        loadComponent: () => import('./features/student/report-list/report-list.component').then((m) => m.ReportListComponent),
      },
    ],
  },
  {
    path: 'janitor',
    title: 'Janitor',
    canActivate: [authGuard, roleGuard(['janitor'])],
    children: [
      {
        path: 'my-jobs',
        loadComponent: () => import('./features/janitor/my-jobs/my-jobs.component').then((m) => m.MyJobsComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/janitor/job-detail/job-detail.component').then((m) => m.JobDetailComponent),
      },
      {
        path: '',
        loadComponent: () => import('./features/janitor/janitor-feed/janitor-feed.component').then((m) => m.JanitorFeedComponent),
      },
    ],
  },
  {
    path: 'auth/login',
    title: 'Login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then( (m) => m.NotFoundComponent),
  },
];

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    title: 'Login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    title: 'Administrator',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: 'supplies',
        loadComponent: () =>
          import('./features/admin/supply-queue/supply-queue').then((m) => m.SupplyQueue),
      },
      {
        path: 'reassignment',
        loadComponent: () =>
          import('./features/admin/reassignment/reassignment.component').then(
            (m) => m.ReassignmentComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/user-management/user-management.component').then(
            (m) => m.UserManagementComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'supplies',
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
        loadComponent: () =>
          import('./features/student/report-create/report-create.component').then(
            (m) => m.ReportCreateComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/student/report-detail/report-detail.component').then(
            (m) => m.ReportDetailComponent,
          ),
      },
      {
        path: '',
        loadComponent: () =>
          import('./features/student/report-list/report-list.component').then(
            (m) => m.ReportListComponent,
          ),
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
        loadComponent: () =>
          import('./features/janitor/my-jobs/my-jobs.component').then((m) => m.MyJobsComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/janitor/job-detail/job-detail.component').then(
            (m) => m.JobDetailComponent,
          ),
      },
      {
        path: '',
        loadComponent: () =>
          import('./features/janitor/janitor-feed/janitor-feed.component').then(
            (m) => m.JanitorFeedComponent,
          ),
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
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];

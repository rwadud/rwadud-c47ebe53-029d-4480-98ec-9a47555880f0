import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';
import { Permission } from '@stms/data';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'audit-log',
    canActivate: [authGuard, permissionGuard(Permission.AUDIT_VIEW)],
    loadComponent: () =>
      import('./pages/audit-log/audit-log.component').then((m) => m.AuditLogComponent),
  },
  {
    path: 'categories',
    canActivate: [authGuard, permissionGuard(Permission.CATEGORY_VIEW)],
    loadComponent: () =>
      import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard, permissionGuard(Permission.USER_MANAGE)],
    loadComponent: () =>
      import('./pages/users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'organizations',
    canActivate: [authGuard, permissionGuard(Permission.ORG_MANAGE)],
    loadComponent: () =>
      import('./pages/organizations/organizations.component').then((m) => m.OrganizationsComponent),
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];

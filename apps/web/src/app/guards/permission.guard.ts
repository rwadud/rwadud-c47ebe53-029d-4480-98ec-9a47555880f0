import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permission } from '@stms/data';

/**
 * Factory that creates a route guard requiring a specific permission.
 * Redirects unauthorized users to the dashboard.
 */
export function permissionGuard(requiredPermission: Permission): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    if (!authService.hasPermission(requiredPermission)) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  };
}

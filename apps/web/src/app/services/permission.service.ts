import { Injectable, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { Permission, hasPermission } from '@stms/data';

/**
 * Dedicated permission service per architecture spec.
 * Centralizes permission checking for the frontend.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private readonly authService: AuthService) { }

  /**
   * Check if the current user has a specific permission.
   */
  hasPermission(permission: Permission): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return hasPermission(user.role, permission);
  }

  readonly canCreateTask = computed(() => this.hasPermission(Permission.TASK_CREATE));
  readonly canViewTasks = computed(() => this.hasPermission(Permission.TASK_VIEW));
  readonly canEditOwnTask = computed(() => this.hasPermission(Permission.TASK_EDIT_OWN));
  readonly canEditAnyTask = computed(() => this.hasPermission(Permission.TASK_EDIT_ANY));
  readonly canDeleteOwnTask = computed(() => this.hasPermission(Permission.TASK_DELETE_OWN));
  readonly canDeleteAnyTask = computed(() => this.hasPermission(Permission.TASK_DELETE_ANY));
  readonly canCreateCategory = computed(() => this.hasPermission(Permission.CATEGORY_CREATE));
  readonly canEditCategory = computed(() => this.hasPermission(Permission.CATEGORY_EDIT));
  readonly canDeleteCategory = computed(() => this.hasPermission(Permission.CATEGORY_DELETE));
  readonly canViewCategories = computed(() => this.hasPermission(Permission.CATEGORY_VIEW));
  readonly canViewAuditLog = computed(() => this.hasPermission(Permission.AUDIT_VIEW));
  readonly canManageUsers = computed(() => this.hasPermission(Permission.USER_MANAGE));
  readonly canManageOrgs = computed(() => this.hasPermission(Permission.ORG_MANAGE));
}

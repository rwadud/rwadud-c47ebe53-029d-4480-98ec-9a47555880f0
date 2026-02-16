import { Permission } from '@stms/data';

/**
 * Frontend permission interface.
 * Derived from the JWT payload and used for conditional UI rendering.
 */
export interface PermissionSet {
  canCreateTask: boolean;
  canViewTasks: boolean;
  canEditOwnTask: boolean;
  canEditAnyTask: boolean;
  canDeleteOwnTask: boolean;
  canDeleteAnyTask: boolean;
  canCreateCategory: boolean;
  canEditCategory: boolean;
  canDeleteCategory: boolean;
  canViewCategories: boolean;
  canViewAuditLog: boolean;
  canManageUsers: boolean;
  canManageOrgs: boolean;
}

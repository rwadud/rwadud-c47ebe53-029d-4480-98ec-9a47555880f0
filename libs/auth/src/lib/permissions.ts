import { Role } from '@stms/data';

export enum Permission {
  TASK_CREATE = 'task:create',
  TASK_VIEW = 'task:view',
  TASK_EDIT_OWN = 'task:edit_own',
  TASK_EDIT_ANY = 'task:edit_any',
  TASK_DELETE_OWN = 'task:delete_own',
  TASK_DELETE_ANY = 'task:delete_any',
  CATEGORY_CREATE = 'category:create',
  CATEGORY_EDIT = 'category:edit',
  CATEGORY_DELETE = 'category:delete',
  CATEGORY_VIEW = 'category:view',
  AUDIT_VIEW = 'audit:view',
  USER_MANAGE = 'user:manage',
  ORG_MANAGE = 'org:manage',
}

export const PERMISSION_MATRIX: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.TASK_CREATE,
    Permission.TASK_VIEW,
    Permission.TASK_EDIT_OWN,
    Permission.TASK_EDIT_ANY,
    Permission.TASK_DELETE_OWN,
    Permission.TASK_DELETE_ANY,
    Permission.CATEGORY_CREATE,
    Permission.CATEGORY_EDIT,
    Permission.CATEGORY_DELETE,
    Permission.CATEGORY_VIEW,
    Permission.AUDIT_VIEW,
    Permission.USER_MANAGE,
    Permission.ORG_MANAGE,
  ],
  [Role.ADMIN]: [
    Permission.TASK_CREATE,
    Permission.TASK_VIEW,
    Permission.TASK_EDIT_OWN,
    Permission.TASK_DELETE_OWN,
    Permission.CATEGORY_VIEW,
    Permission.AUDIT_VIEW,
  ],
  [Role.VIEWER]: [
    Permission.TASK_VIEW,
    Permission.CATEGORY_VIEW,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSION_MATRIX[role]?.includes(permission) ?? false;
}

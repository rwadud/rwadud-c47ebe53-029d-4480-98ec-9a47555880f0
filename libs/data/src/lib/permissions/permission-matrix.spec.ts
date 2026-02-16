import { Role, Permission, hasPermission, PERMISSION_MATRIX } from '@stms/data';

/**
 * RBAC Permission Matrix Tests
 * Tests the data-driven permission matrix to ensure correct
 * role-to-permission mappings for all security-critical operations.
 */
describe('RBAC Permission Matrix', () => {
  // ─── Owner Permissions ───
  describe('Owner role', () => {
    it('should have all task permissions', () => {
      expect(hasPermission(Role.OWNER, Permission.TASK_CREATE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.TASK_VIEW)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.TASK_EDIT_OWN)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.TASK_EDIT_ANY)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.TASK_DELETE_OWN)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.TASK_DELETE_ANY)).toBe(true);
    });

    it('should have all category permissions', () => {
      expect(hasPermission(Role.OWNER, Permission.CATEGORY_CREATE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.CATEGORY_EDIT)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.CATEGORY_DELETE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.CATEGORY_VIEW)).toBe(true);
    });

    it('should have audit view permission', () => {
      expect(hasPermission(Role.OWNER, Permission.AUDIT_VIEW)).toBe(true);
    });

    it('should have management permissions', () => {
      expect(hasPermission(Role.OWNER, Permission.USER_MANAGE)).toBe(true);
      expect(hasPermission(Role.OWNER, Permission.ORG_MANAGE)).toBe(true);
    });
  });

  // ─── Admin Permissions ───
  describe('Admin role', () => {
    it('should create and view tasks', () => {
      expect(hasPermission(Role.ADMIN, Permission.TASK_CREATE)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.TASK_VIEW)).toBe(true);
    });

    it('should edit/delete own tasks only', () => {
      expect(hasPermission(Role.ADMIN, Permission.TASK_EDIT_OWN)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.TASK_DELETE_OWN)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.TASK_EDIT_ANY)).toBe(false);
      expect(hasPermission(Role.ADMIN, Permission.TASK_DELETE_ANY)).toBe(false);
    });

    it('should only view categories, not create/edit/delete', () => {
      expect(hasPermission(Role.ADMIN, Permission.CATEGORY_VIEW)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.CATEGORY_CREATE)).toBe(false);
      expect(hasPermission(Role.ADMIN, Permission.CATEGORY_EDIT)).toBe(false);
      expect(hasPermission(Role.ADMIN, Permission.CATEGORY_DELETE)).toBe(false);
    });

    it('should view audit log', () => {
      expect(hasPermission(Role.ADMIN, Permission.AUDIT_VIEW)).toBe(true);
    });

    it('should NOT have management permissions', () => {
      expect(hasPermission(Role.ADMIN, Permission.USER_MANAGE)).toBe(false);
      expect(hasPermission(Role.ADMIN, Permission.ORG_MANAGE)).toBe(false);
    });
  });

  // ─── Viewer Permissions ───
  describe('Viewer role', () => {
    it('should only view tasks', () => {
      expect(hasPermission(Role.VIEWER, Permission.TASK_VIEW)).toBe(true);
    });

    it('should NOT create tasks', () => {
      expect(hasPermission(Role.VIEWER, Permission.TASK_CREATE)).toBe(false);
    });

    it('should NOT edit any tasks', () => {
      expect(hasPermission(Role.VIEWER, Permission.TASK_EDIT_OWN)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permission.TASK_EDIT_ANY)).toBe(false);
    });

    it('should NOT delete any tasks', () => {
      expect(hasPermission(Role.VIEWER, Permission.TASK_DELETE_OWN)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permission.TASK_DELETE_ANY)).toBe(false);
    });

    it('should view but NOT manage categories', () => {
      expect(hasPermission(Role.VIEWER, Permission.CATEGORY_VIEW)).toBe(true);
      expect(hasPermission(Role.VIEWER, Permission.CATEGORY_CREATE)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permission.CATEGORY_EDIT)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permission.CATEGORY_DELETE)).toBe(false);
    });

    it('should NOT view audit log', () => {
      expect(hasPermission(Role.VIEWER, Permission.AUDIT_VIEW)).toBe(false);
    });

    it('should NOT have management permissions', () => {
      expect(hasPermission(Role.VIEWER, Permission.USER_MANAGE)).toBe(false);
      expect(hasPermission(Role.VIEWER, Permission.ORG_MANAGE)).toBe(false);
    });
  });

  // ─── Edge Cases ───
  describe('Edge cases', () => {
    it('should return false for unknown role', () => {
      expect(hasPermission('superadmin' as Role, Permission.TASK_CREATE)).toBe(false);
    });

    it('should return false for unknown permission', () => {
      expect(hasPermission(Role.OWNER, 'task:fly' as Permission)).toBe(false);
    });

    it('should have exactly 3 roles defined', () => {
      expect(Object.keys(PERMISSION_MATRIX).length).toBe(3);
    });

    it('should include owner, admin, and viewer roles', () => {
      expect(PERMISSION_MATRIX[Role.OWNER]).toBeDefined();
      expect(PERMISSION_MATRIX[Role.ADMIN]).toBeDefined();
      expect(PERMISSION_MATRIX[Role.VIEWER]).toBeDefined();
    });

    it('should give Owner strictly more permissions than Admin', () => {
      const ownerPerms = PERMISSION_MATRIX[Role.OWNER];
      const adminPerms = PERMISSION_MATRIX[Role.ADMIN];
      // Every admin perm should also exist in owner
      adminPerms.forEach(p => {
        expect(ownerPerms).toContain(p);
      });
      // Owner should have more than admin
      expect(ownerPerms.length).toBeGreaterThan(adminPerms.length);
    });

    it('should give Admin strictly more permissions than Viewer', () => {
      const adminPerms = PERMISSION_MATRIX[Role.ADMIN];
      const viewerPerms = PERMISSION_MATRIX[Role.VIEWER];
      viewerPerms.forEach(p => {
        expect(adminPerms).toContain(p);
      });
      expect(adminPerms.length).toBeGreaterThan(viewerPerms.length);
    });
  });
});

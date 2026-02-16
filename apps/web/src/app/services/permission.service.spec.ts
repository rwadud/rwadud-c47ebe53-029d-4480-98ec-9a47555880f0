import { TestBed } from '@angular/core/testing';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';
import { Permission, Role } from '@stms/data';
import { signal } from '@angular/core';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockAuthService: any;

  const createUser = (role: Role) => ({
    id: 1,
    name: 'Test',
    email: 'test@x.com',
    role,
    organizationId: 1,
    organization: { id: 1, name: 'Org', parentId: null },
  });

  beforeEach(() => {
    mockAuthService = {
      currentUser: signal<any>(null),
    };

    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(PermissionService);
  });

  describe('hasPermission', () => {
    it('should return false when no user is logged in', () => {
      expect(service.hasPermission(Permission.TASK_VIEW)).toBe(false);
    });

    it('should return true for owner with any permission', () => {
      mockAuthService.currentUser.set(createUser(Role.OWNER));
      expect(service.hasPermission(Permission.USER_MANAGE)).toBe(true);
      expect(service.hasPermission(Permission.ORG_MANAGE)).toBe(true);
      expect(service.hasPermission(Permission.TASK_VIEW)).toBe(true);
    });

    it('should deny admin from USER_MANAGE', () => {
      mockAuthService.currentUser.set(createUser(Role.ADMIN));
      expect(service.hasPermission(Permission.USER_MANAGE)).toBe(false);
    });

    it('should deny viewer from TASK_CREATE', () => {
      mockAuthService.currentUser.set(createUser(Role.VIEWER));
      expect(service.hasPermission(Permission.TASK_CREATE)).toBe(false);
    });
  });

  describe('computed permission properties', () => {
    it('owner should have all computed permissions', () => {
      mockAuthService.currentUser.set(createUser(Role.OWNER));

      expect(service.canCreateTask()).toBe(true);
      expect(service.canViewTasks()).toBe(true);
      expect(service.canEditAnyTask()).toBe(true);
      expect(service.canDeleteAnyTask()).toBe(true);
      expect(service.canCreateCategory()).toBe(true);
      expect(service.canManageUsers()).toBe(true);
      expect(service.canManageOrgs()).toBe(true);
      expect(service.canViewAuditLog()).toBe(true);
    });

    it('admin should have limited computed permissions', () => {
      mockAuthService.currentUser.set(createUser(Role.ADMIN));

      expect(service.canCreateTask()).toBe(true);
      expect(service.canViewTasks()).toBe(true);
      expect(service.canEditOwnTask()).toBe(true);
      expect(service.canEditAnyTask()).toBe(false);
      expect(service.canDeleteOwnTask()).toBe(true);
      expect(service.canDeleteAnyTask()).toBe(false);
      expect(service.canCreateCategory()).toBe(false);
      expect(service.canManageUsers()).toBe(false);
      expect(service.canManageOrgs()).toBe(false);
    });

    it('viewer should be mostly read-only', () => {
      mockAuthService.currentUser.set(createUser(Role.VIEWER));

      expect(service.canViewTasks()).toBe(true);
      expect(service.canCreateTask()).toBe(false);
      expect(service.canEditOwnTask()).toBe(false);
      expect(service.canEditAnyTask()).toBe(false);
      expect(service.canDeleteOwnTask()).toBe(false);
      expect(service.canDeleteAnyTask()).toBe(false);
      expect(service.canCreateCategory()).toBe(false);
      expect(service.canManageUsers()).toBe(false);
      expect(service.canManageOrgs()).toBe(false);
    });

    it('should update when user changes', () => {
      expect(service.canManageUsers()).toBe(false); // no user

      mockAuthService.currentUser.set(createUser(Role.OWNER));
      expect(service.canManageUsers()).toBe(true);

      mockAuthService.currentUser.set(createUser(Role.VIEWER));
      expect(service.canManageUsers()).toBe(false);
    });
  });
});

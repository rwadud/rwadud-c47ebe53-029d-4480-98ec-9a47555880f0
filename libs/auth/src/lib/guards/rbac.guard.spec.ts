import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './rbac.guard';
import { Permission } from '@stms/data';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RbacGuard(reflector);
  });

  function createMockContext(user: any, permissions?: Permission[]): ExecutionContext {
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permissions ?? null);

    return context;
  }

  describe('when no permissions are required', () => {
    it('should allow access', () => {
      const ctx = createMockContext({ role: 'viewer', sub: 1 }, undefined);
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow access for empty permissions array', () => {
      const ctx = createMockContext({ role: 'viewer', sub: 1 }, []);
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('when permissions are required', () => {
    it('should allow owner to access USER_MANAGE routes', () => {
      const ctx = createMockContext(
        { role: 'owner', sub: 1 },
        [Permission.USER_MANAGE],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny admin from USER_MANAGE routes', () => {
      const ctx = createMockContext(
        { role: 'admin', sub: 2 },
        [Permission.USER_MANAGE],
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should deny viewer from USER_MANAGE routes', () => {
      const ctx = createMockContext(
        { role: 'viewer', sub: 3 },
        [Permission.USER_MANAGE],
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow admin to access TASK_CREATE routes', () => {
      const ctx = createMockContext(
        { role: 'admin', sub: 2 },
        [Permission.TASK_CREATE],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny viewer from TASK_CREATE routes', () => {
      const ctx = createMockContext(
        { role: 'viewer', sub: 3 },
        [Permission.TASK_CREATE],
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow viewer to access TASK_VIEW routes', () => {
      const ctx = createMockContext(
        { role: 'viewer', sub: 3 },
        [Permission.TASK_VIEW],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should allow owner to access ORG_MANAGE routes', () => {
      const ctx = createMockContext(
        { role: 'owner', sub: 1 },
        [Permission.ORG_MANAGE],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny admin from ORG_MANAGE routes', () => {
      const ctx = createMockContext(
        { role: 'admin', sub: 2 },
        [Permission.ORG_MANAGE],
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow admin to access AUDIT_VIEW routes', () => {
      const ctx = createMockContext(
        { role: 'admin', sub: 2 },
        [Permission.AUDIT_VIEW],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should deny viewer from AUDIT_VIEW routes', () => {
      const ctx = createMockContext(
        { role: 'viewer', sub: 3 },
        [Permission.AUDIT_VIEW],
      );
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should require ALL permissions when multiple are specified', () => {
      const ctx = createMockContext(
        { role: 'admin', sub: 2 },
        [Permission.TASK_CREATE, Permission.TASK_EDIT_ANY],
      );
      // Admin has TASK_CREATE but not TASK_EDIT_ANY
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should allow when user has ALL required permissions', () => {
      const ctx = createMockContext(
        { role: 'owner', sub: 1 },
        [Permission.TASK_CREATE, Permission.TASK_EDIT_ANY],
      );
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('when no user is present', () => {
    it('should throw ForbiddenException', () => {
      const ctx = createMockContext(null, [Permission.TASK_VIEW]);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for undefined user', () => {
      const ctx = createMockContext(undefined, [Permission.TASK_VIEW]);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});

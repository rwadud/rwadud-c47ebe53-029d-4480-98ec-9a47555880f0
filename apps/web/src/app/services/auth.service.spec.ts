import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role, Permission } from '@stms/data';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigate: jest.Mock };

  const mockUser = {
    id: 1,
    name: 'Sarah',
    email: 'sarah@hq.com',
    role: Role.OWNER,
    organizationId: 1,
    organization: { id: 1, name: 'HQ', parentId: null },
  };

  const mockLoginResponse = {
    accessToken: 'jwt-token-123',
    user: mockUser,
  };

  beforeEach(() => {
    router = { navigate: jest.fn() };
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('should POST to /api/auth/login', () => {
      service.login('sarah@hq.com', 'pass').subscribe((res) => {
        expect(res).toEqual(mockLoginResponse);
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'sarah@hq.com', password: 'pass' });
      req.flush(mockLoginResponse);
    });
  });

  describe('handleLoginSuccess', () => {
    it('should store token and user in localStorage and update signal', () => {
      service.handleLoginSuccess(mockLoginResponse as any);

      expect(localStorage.getItem('stms_token')).toBe('jwt-token-123');
      expect(JSON.parse(localStorage.getItem('stms_user')!)).toEqual(mockUser);
      expect(service.currentUser()).toBeTruthy();
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear storage, user signal, and navigate to login', () => {
      service.handleLoginSuccess(mockLoginResponse as any);
      service.logout();

      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
      expect(localStorage.getItem('stms_token')).toBeNull();
      expect(localStorage.getItem('stms_user')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getToken', () => {
    it('should return the stored token', () => {
      localStorage.setItem('stms_token', 'abc');
      expect(service.getToken()).toBe('abc');
    });

    it('should return null when no token', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('role checks', () => {
    it('should identify owner role', () => {
      service.handleLoginSuccess(mockLoginResponse as any);
      expect(service.isOwner()).toBe(true);
      expect(service.isAdmin()).toBe(false);
      expect(service.isViewer()).toBe(false);
    });

    it('should identify admin role', () => {
      service.handleLoginSuccess({
        accessToken: 'x',
        user: { ...mockUser, role: Role.ADMIN },
      } as any);
      expect(service.isOwner()).toBe(false);
      expect(service.isAdmin()).toBe(true);
    });

    it('should identify viewer role', () => {
      service.handleLoginSuccess({
        accessToken: 'x',
        user: { ...mockUser, role: Role.VIEWER },
      } as any);
      expect(service.isViewer()).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return true for owner with USER_MANAGE', () => {
      service.handleLoginSuccess(mockLoginResponse as any);
      expect(service.hasPermission(Permission.USER_MANAGE)).toBe(true);
    });

    it('should return false when no user is logged in', () => {
      expect(service.hasPermission(Permission.USER_MANAGE)).toBe(false);
    });
  });

  describe('canEditTask / canDeleteTask', () => {
    it('owner can edit any task', () => {
      service.handleLoginSuccess(mockLoginResponse as any);
      expect(service.canEditTask(999)).toBe(true);
    });

    it('owner can delete any task', () => {
      service.handleLoginSuccess(mockLoginResponse as any);
      expect(service.canDeleteTask(999)).toBe(true);
    });

    it('admin can edit own tasks only', () => {
      service.handleLoginSuccess({
        accessToken: 'x',
        user: { ...mockUser, id: 5, role: Role.ADMIN },
      } as any);
      expect(service.canEditTask(5)).toBe(true);
      expect(service.canEditTask(99)).toBe(false);
    });

    it('admin can delete own tasks only', () => {
      service.handleLoginSuccess({
        accessToken: 'x',
        user: { ...mockUser, id: 5, role: Role.ADMIN },
      } as any);
      expect(service.canDeleteTask(5)).toBe(true);
      expect(service.canDeleteTask(99)).toBe(false);
    });

    it('viewer cannot edit or delete tasks', () => {
      service.handleLoginSuccess({
        accessToken: 'x',
        user: { ...mockUser, role: Role.VIEWER },
      } as any);
      expect(service.canEditTask(1)).toBe(false);
      expect(service.canDeleteTask(1)).toBe(false);
    });

    it('returns false when not logged in', () => {
      expect(service.canEditTask(1)).toBe(false);
      expect(service.canDeleteTask(1)).toBe(false);
    });
  });
});

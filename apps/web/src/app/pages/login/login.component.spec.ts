import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { of, throwError, Observable } from 'rxjs';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: any;
  let router: any;
  let toastService: any;

  beforeEach(async () => {
    authService = {
      isLoggedIn: jest.fn().mockReturnValue(false),
      login: jest.fn(),
      handleLoginSuccess: jest.fn(),
      currentUser: signal(null),
    };
    router = { navigate: jest.fn() };
    toastService = { success: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to dashboard if already logged in', () => {
    authService.isLoggedIn.mockReturnValue(true);
    const fixture2 = TestBed.createComponent(LoginComponent);
    fixture2.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  describe('fillCredentials', () => {
    it('should set email and password', () => {
      component.fillCredentials('sarah@hq.com');
      expect(component.email).toBe('sarah@hq.com');
      expect(component.password).toBe('Password123!');
    });
  });

  describe('onLogin', () => {
    it('should call authService.login and navigate on success', () => {
      const mockResponse = {
        accessToken: 'token',
        user: { id: 1, name: 'Sarah' },
      };
      authService.login.mockReturnValue(of(mockResponse));

      component.email = 'sarah@hq.com';
      component.password = 'pass';
      component.onLogin();

      expect(authService.login).toHaveBeenCalledWith('sarah@hq.com', 'pass');
      expect(authService.handleLoginSuccess).toHaveBeenCalledWith(mockResponse);
      expect(toastService.success).toHaveBeenCalledWith('Welcome, Sarah!');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(component.loading()).toBe(false);
    });

    it('should display error message on login failure', () => {
      authService.login.mockReturnValue(
        throwError(() => ({ error: { message: 'Invalid credentials' } })),
      );

      component.email = 'bad@x.com';
      component.password = 'wrong';
      component.onLogin();

      expect(component.loading()).toBe(false);
      expect(component.errorMsg()).toBe('Invalid credentials');
    });

    it('should display fallback error when no message provided', () => {
      authService.login.mockReturnValue(
        throwError(() => ({ error: {} })),
      );

      component.onLogin();
      expect(component.errorMsg()).toBe('Invalid credentials');
    });

    it('should set loading to true while request is pending', () => {
      authService.login.mockReturnValue(new Observable(() => { }));

      component.onLogin();
      expect(component.loading()).toBe(true);
    });
  });
});

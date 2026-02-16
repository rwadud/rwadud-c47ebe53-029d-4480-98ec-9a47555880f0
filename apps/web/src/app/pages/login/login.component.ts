import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="var(--color-accent)"/>
              <path d="M12 14h16M12 20h16M12 26h10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="28" cy="26" r="3" fill="white"/>
            </svg>
          </div>
          <h1>Secure Task Manager</h1>
          <p class="text-secondary">Sign in to your account</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              type="email"
              class="form-input"
              [(ngModel)]="email"
              name="email"
              placeholder="sarah@hq.com"
              required
              [disabled]="loading()"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-input"
              [(ngModel)]="password"
              name="password"
              placeholder="Password123!"
              required
              [disabled]="loading()"
            />
          </div>

          @if (errorMsg()) {
            <div class="error-msg">{{ errorMsg() }}</div>
          }

          <button type="submit" class="btn btn-primary w-full justify-center" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Signing in...
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="demo-credentials">
          <p class="text-secondary text-sm font-semibold mb-2">Demo Accounts</p>
          <div class="demo-grid">
            <button class="demo-user" (click)="fillCredentials('sarah@hq.com')">
              <span class="badge badge-owner">Owner</span>
              <span class="text-sm">sarah&#64;hq.com</span>
            </button>
            <button class="demo-user" (click)="fillCredentials('marcus@east.com')">
              <span class="badge badge-admin">Admin</span>
              <span class="text-sm">marcus&#64;east.com</span>
            </button>
            <button class="demo-user" (click)="fillCredentials('priya@west.com')">
              <span class="badge badge-viewer">Viewer</span>
              <span class="text-sm">priya&#64;west.com</span>
            </button>
          </div>
          <p class="text-muted text-xs mt-2">Password: Password123!</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: linear-gradient(-45deg, #667eea, #764ba2, #6366f1, #4f46e5, #7c3aed);
      background-size: 400% 400%;
      animation: gradientFlow 12s ease infinite;
      position: relative;
      overflow: hidden;
    }
    .login-page::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08) 0%, transparent 50%),
                  radial-gradient(circle at 70% 60%, rgba(255,255,255,0.05) 0%, transparent 50%);
      animation: gradientFlow 8s ease infinite reverse;
    }
    @keyframes gradientFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .login-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 24px;
      padding: 44px 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.35), 0 0 40px rgba(99, 102, 241, 0.15);
      animation: cardFloat 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 1;
    }
    :host-context(.dark) .login-card {
      background: rgba(22, 29, 47, 0.95);
      border-color: rgba(99, 102, 241, 0.25);
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(99, 102, 241, 0.2);
    }
    @keyframes cardFloat {
      from { opacity: 0; transform: translateY(30px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .login-header {
      text-align: center;
      margin-bottom: 36px;
    }
    .login-logo {
      margin-bottom: 20px;
      display: flex;
      justify-content: center;
    }
    .login-logo svg {
      filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.35));
      transition: transform 0.3s ease;
    }
    .login-logo svg:hover {
      transform: scale(1.1) rotate(3deg);
    }
    .login-header h1 {
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 6px;
      color: #1e293b;
      letter-spacing: -0.5px;
    }
    :host-context(.dark) .login-header h1 {
      color: #f1f5f9;
    }
    .login-header p {
      margin: 0;
      font-size: 15px;
      color: #64748b;
    }
    :host-context(.dark) .login-header p {
      color: #94a3b8;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-group label {
      color: #475569;
    }
    :host-context(.dark) .form-group label {
      color: #cbd5e1;
    }
    .form-group .form-input {
      background: #f8fafc;
      border-color: #e2e8f0;
      color: #1e293b;
    }
    :host-context(.dark) .form-group .form-input {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(71, 85, 105, 0.5);
      color: #f1f5f9;
    }
    :host-context(.dark) .form-group .form-input::placeholder {
      color: #64748b;
    }
    .error-msg {
      background: rgba(239, 68, 68, 0.08);
      color: #ef4444;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      border: 1px solid rgba(239, 68, 68, 0.15);
    }
    .demo-credentials {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }
    :host-context(.dark) .demo-credentials {
      border-top-color: rgba(71, 85, 105, 0.4);
    }
    .demo-credentials .text-secondary {
      color: #64748b !important;
    }
    :host-context(.dark) .demo-credentials .text-secondary {
      color: #94a3b8 !important;
    }
    .demo-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .demo-user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      color: #1e293b;
      font-size: 14px;
    }
    :host-context(.dark) .demo-user {
      background: rgba(30, 41, 59, 0.6);
      border-color: rgba(71, 85, 105, 0.4);
      color: #e2e8f0;
    }
    .demo-user:hover {
      background: #f1f5f9;
      transform: translateX(6px);
      border-color: var(--color-accent);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.12);
    }
    :host-context(.dark) .demo-user:hover {
      background: rgba(51, 65, 85, 0.6);
    }
    .demo-credentials .text-muted {
      color: #94a3b8 !important;
    }
    @media (max-width: 480px) {
      .login-card { padding: 32px 24px; }
    }
  `],
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  fillCredentials(email: string) {
    this.email = email;
    this.password = 'Password123!';
  }

  onLogin() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authService.handleLoginSuccess(response);
        this.toast.success(`Welcome, ${response.user.name}!`);
        this.router.navigate(['/dashboard']);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Invalid credentials');
        this.loading.set(false);
      },
    });
  }
}

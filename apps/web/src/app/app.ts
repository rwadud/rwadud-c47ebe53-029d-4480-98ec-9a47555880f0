import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { ToastService } from './services/toast.service';
import { Permission } from '@stms/data';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (authService.isLoggedIn()) {
      <div class="app-layout">
        <nav class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="var(--color-accent)"/>
                <path d="M12 14h16M12 20h16M12 26h10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <circle cx="28" cy="26" r="3" fill="white"/>
              </svg>
              <span class="sidebar-brand">STMS</span>
            </div>
          </div>

          <div class="sidebar-nav">
            <a routerLink="/dashboard" routerLinkActive="nav-active" class="nav-item">
              <span class="nav-icon material-symbols-outlined">task_alt</span> Tasks
            </a>
            @if (authService.hasPermission(auditPerm)) {
              <a routerLink="/audit-log" routerLinkActive="nav-active" class="nav-item">
                <span class="nav-icon material-symbols-outlined">monitoring</span> Audit Log
              </a>
            }
            @if (authService.hasPermission(categoryViewPerm)) {
              <a routerLink="/categories" routerLinkActive="nav-active" class="nav-item">
                <span class="nav-icon material-symbols-outlined">label</span> Categories
              </a>
            }
            @if (authService.hasPermission(userManagePerm)) {
              <a routerLink="/users" routerLinkActive="nav-active" class="nav-item">
                <span class="nav-icon material-symbols-outlined">group</span> Users
              </a>
            }
            @if (authService.hasPermission(orgManagePerm)) {
              <a routerLink="/organizations" routerLinkActive="nav-active" class="nav-item">
                <span class="nav-icon material-symbols-outlined">apartment</span> Organizations
              </a>
            }
          </div>

          <div class="sidebar-footer">
            <div class="user-card">
              <div class="user-avatar">{{ getInitials() }}</div>
              <div class="user-info">
                <div class="user-name truncate">{{ authService.currentUser()?.name }}</div>
                <div class="flex gap-1 items-center">
                  <span class="badge" [class]="'badge-' + authService.currentUser()?.role">
                    {{ authService.currentUser()?.role }}
                  </span>
                </div>
              </div>
            </div>
            <div style="padding: 6px 12px 0">
              <span class="org-badge">{{ authService.currentUser()?.organization?.name }}</span>
            </div>
            <div class="sidebar-actions">
              <button class="btn btn-ghost btn-sm w-full" (click)="themeService.toggle()" style="justify-content: flex-start">
                <span class="material-symbols-outlined" style="font-size: 18px">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
                {{ themeService.isDark() ? 'Light Mode' : 'Dark Mode' }}
              </button>
              <button class="btn btn-ghost btn-sm w-full" (click)="authService.logout()" style="justify-content: flex-start; color: var(--color-danger)">
                <span class="material-symbols-outlined" style="font-size: 18px">logout</span> Sign Out
              </button>
            </div>
          </div>
        </nav>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }

    <!-- Toast Container -->
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" (click)="toastService.dismiss(toast.id)">
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 240px;
      background: var(--sidebar-bg);
      border-right: var(--sidebar-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
      transition: background 0.3s;
    }
    .sidebar-header {
      padding: 20px 16px 16px;
      border-bottom: 1px solid var(--color-border);
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sidebar-brand {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .sidebar-nav {
      flex: 1;
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .nav-item:hover {
      background: var(--color-bg-tertiary);
      color: var(--color-text-primary);
      transform: translateX(2px);
    }
    .nav-active {
      background: var(--color-accent-light) !important;
      color: var(--color-accent) !important;
      font-weight: 600;
      box-shadow: inset 3px 0 0 var(--color-accent);
    }
    .sidebar-footer {
      padding: 12px 8px;
      border-top: 1px solid var(--color-border);
    }
    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-accent);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .user-info { min-width: 0; }
    .user-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
    .org-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      background: var(--color-bg-tertiary);
      border: 1px solid var(--color-border);
      letter-spacing: 0.3px;
    }
    .sidebar-actions {
      padding: 8px 0 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .main-content {
      flex: 1;
      margin-left: 240px;
      padding: 24px 28px;
    }
    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        position: fixed;
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        height: auto;
        flex-direction: row;
        border-right: none;
        border-top: 1px solid var(--color-border);
        z-index: 200;
      }
      .sidebar-header, .sidebar-footer { display: none; }
      .sidebar-nav {
        flex-direction: row;
        justify-content: center;
        padding: 8px 12px;
        width: 100%;
      }
      .nav-item { padding: 8px 16px; font-size: 13px; }
      .main-content {
        margin-left: 0;
        padding: 16px;
        padding-bottom: 70px;
      }
    }
  `],
})
export class AppComponent {
  auditPerm = Permission.AUDIT_VIEW;
  categoryViewPerm = Permission.CATEGORY_VIEW;
  userManagePerm = Permission.USER_MANAGE;
  orgManagePerm = Permission.ORG_MANAGE;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService,
    public toastService: ToastService,
  ) { }

  getInitials(): string {
    const name = this.authService.currentUser()?.name || '';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  }
}

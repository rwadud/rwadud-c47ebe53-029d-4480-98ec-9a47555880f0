import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginResponse, User, TokenPayload, Role } from '@stms/data';
import { Permission, hasPermission } from '@stms/data';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'stms_token';
  private readonly userKey = 'stms_user';

  currentUser = signal<(User & { organization: { id: number; name: string; parentId: number | null } }) | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem(this.tokenKey);
    const userJson = localStorage.getItem(this.userKey);
    if (token && userJson) {
      try {
        this.currentUser.set(JSON.parse(userJson));
      } catch {
        this.clearStorage();
      }
    }
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password });
  }

  handleLoginSuccess(response: LoginResponse) {
    localStorage.setItem(this.tokenKey, response.accessToken);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUser.set(response.user as any);
  }

  logout() {
    this.clearStorage();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  hasPermission(permission: Permission): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return hasPermission(user.role, permission);
  }

  isOwner(): boolean {
    return this.currentUser()?.role === Role.OWNER;
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === Role.ADMIN;
  }

  isViewer(): boolean {
    return this.currentUser()?.role === Role.VIEWER;
  }

  canEditTask(taskCreatedById: number): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (this.hasPermission(Permission.TASK_EDIT_ANY)) return true;
    if (this.hasPermission(Permission.TASK_EDIT_OWN) && taskCreatedById === user.id) return true;
    return false;
  }

  canDeleteTask(taskCreatedById: number): boolean {
    const user = this.currentUser();
    if (!user) return false;
    if (this.hasPermission(Permission.TASK_DELETE_ANY)) return true;
    if (this.hasPermission(Permission.TASK_DELETE_OWN) && taskCreatedById === user.id) return true;
    return false;
  }

  private clearStorage() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}

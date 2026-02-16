import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { IUser, IOrganization, CreateUserDto } from '@stms/data';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="users-page">
      <div class="flex items-center justify-between mb-4">
        <h2 class="page-title" style="margin: 0;">User Management</h2>
        <button class="btn btn-primary" (click)="openCreateModal()">+ New User</button>
      </div>

      @if (loading()) {
        <div class="flex justify-center" style="padding: 40px">
          <div class="spinner" style="width: 28px; height: 28px"></div>
        </div>
      } @else {
        <div class="users-table-wrap">
          <table class="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Organization</th>
                <th style="width: 100px">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <span class="user-name-cell">{{ user.name }}</span>
                    @if (user.id === authService.currentUser()?.id) {
                      <span class="badge badge-info" style="margin-left: 6px; font-size: 10px">You</span>
                    }
                  </td>
                  <td class="text-muted">{{ user.email }}</td>
                  <td>
                    <span class="badge" [class]="'badge-' + user.role">{{ user.role }}</span>
                  </td>
                  <td class="text-muted">{{ user.organization?.name || '—' }}</td>
                  <td>
                    @if (user.role !== 'owner') {
                      <div class="flex gap-1">
                        <button class="btn btn-ghost btn-sm" (click)="openEditModal(user)" title="Edit"><span class="material-symbols-outlined" style="font-size: 16px">edit</span></button>
                        <button class="btn btn-ghost btn-sm" (click)="confirmDelete(user)" title="Delete"
                                [disabled]="user.id === authService.currentUser()?.id"><span class="material-symbols-outlined" style="font-size: 16px">delete</span></button>
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (users().length === 0) {
            <div class="text-center text-muted" style="padding: 40px">No users found.</div>
          }
        </div>
      }
    </div>

    <!-- Create/Edit User Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 style="margin: 0 0 20px; font-size: 18px">
            {{ editingUser() ? 'Edit User' : 'Create User' }}
          </h3>
          <form (ngSubmit)="saveUser()" class="flex flex-col gap-3">
            @if (!editingUser()) {
              <div>
                <label class="form-label">Email *</label>
                <input class="form-input" [(ngModel)]="modalData.email" name="email"
                       type="email" required placeholder="user@example.com" />
              </div>
              <div>
                <label class="form-label">Password *</label>
                <input class="form-input" [(ngModel)]="modalData.password" name="password"
                       type="password" required placeholder="Min 8 characters" />
              </div>
            }
            <div>
              <label class="form-label">Full Name *</label>
              <input class="form-input" [(ngModel)]="modalData.name" name="name"
                     required placeholder="Jane Doe" />
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="form-label">Role</label>
                <select class="form-input form-select" [(ngModel)]="modalData.role" name="role">
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="form-label">Organization</label>
                <select class="form-input form-select" [(ngModel)]="modalData.organizationId" name="org">
                  @for (org of organizations(); track org.id) {
                    <option [ngValue]="org.id">{{ org.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="flex gap-2 justify-between mt-2">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> }
                {{ editingUser() ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deleteTarget()) {
      <app-confirm-dialog
        title="Delete User"
        [message]="'Are you sure you want to delete <strong>' + deleteTarget()!.name + '</strong> (' + deleteTarget()!.email + ')?'"
        confirmLabel="Delete"
        [destructive]="true"
        [loading]="saving()"
        (confirmed)="doDelete()"
        (cancelled)="cancelDelete()"
      />
    }
  `,
  styles: [`
    .users-page {
      padding: 0;
      animation: pageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .page-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .users-table-wrap {
      background: var(--color-bg-secondary);
      border-radius: 14px;
      border: 1px solid var(--color-border);
      overflow: hidden;
      box-shadow: var(--color-card-shadow);
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
    }
    .users-table th {
      text-align: left;
      padding: 14px 16px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--color-text-muted);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-tertiary);
    }
    .users-table td {
      padding: 14px 16px;
      font-size: 14px;
      border-bottom: 1px solid var(--color-border);
    }
    .users-table tr:last-child td {
      border-bottom: none;
    }
    .users-table tbody tr {
      transition: background 0.2s ease;
    }
    .users-table tbody tr:hover td {
      background: var(--color-bg-tertiary);
    }
    .user-name-cell {
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .badge-info {
      background: var(--color-accent-light);
      color: var(--color-accent);
    }
  `],
})
export class UsersComponent implements OnInit {
  users = signal<(IUser & { organization?: { id: number; name: string } })[]>([]);
  organizations = signal<IOrganization[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editingUser = signal<IUser | null>(null);
  deleteTarget = signal<IUser | null>(null);

  modalData = {
    email: '',
    password: '',
    name: '',
    role: 'admin' as 'admin' | 'viewer',
    organizationId: null as number | null,
  };

  constructor(
    private userService: UserService,
    private orgService: OrganizationService,
    public authService: AuthService,
    private toast: ToastService,
  ) { }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.orgService.getOrganizations().subscribe({
      next: (orgs) => this.organizations.set(orgs),
    });
    this.userService.getUsers().subscribe({
      next: (users) => { this.users.set(users as any); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreateModal() {
    this.editingUser.set(null);
    this.modalData = {
      email: '', password: '', name: '',
      role: 'admin',
      organizationId: this.organizations()[0]?.id ?? null,
    };
    this.showModal.set(true);
  }

  openEditModal(user: IUser) {
    this.editingUser.set(user);
    this.modalData = {
      email: user.email,
      password: '',
      name: user.name,
      role: user.role as 'admin' | 'viewer',
      organizationId: user.organizationId,
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingUser.set(null);
  }

  saveUser() {
    if (!this.modalData.name.trim()) {
      this.toast.error('Name is required');
      return;
    }

    this.saving.set(true);
    const editing = this.editingUser();

    if (editing) {
      this.userService.updateUser(editing.id, {
        name: this.modalData.name,
        role: this.modalData.role,
        organizationId: this.modalData.organizationId ?? undefined,
      }).subscribe({
        next: () => {
          this.toast.success('User updated');
          this.closeModal();
          this.load();
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to update user');
          this.saving.set(false);
        },
      });
    } else {
      if (!this.modalData.email.trim() || !this.modalData.password.trim()) {
        this.toast.error('Email and password are required');
        this.saving.set(false);
        return;
      }
      this.userService.createUser({
        email: this.modalData.email,
        password: this.modalData.password,
        name: this.modalData.name,
        role: this.modalData.role,
        organizationId: this.modalData.organizationId!,
      }).subscribe({
        next: () => {
          this.toast.success('User created');
          this.closeModal();
          this.load();
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to create user');
          this.saving.set(false);
        },
      });
    }
  }

  confirmDelete(user: IUser) {
    this.deleteTarget.set(user);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  doDelete() {
    const user = this.deleteTarget();
    if (!user) return;
    this.saving.set(true);
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.toast.success('User deleted');
        this.cancelDelete();
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete user');
        this.saving.set(false);
      },
    });
  }
}

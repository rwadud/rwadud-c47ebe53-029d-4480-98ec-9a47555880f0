import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../../services/organization.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Organization } from '@stms/data';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

interface OrgTreeNode {
  parent: Organization;
  children: Organization[];
}

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="orgs-page">
      <div class="page-header">
        <div>
          <h2 class="page-title">Organizations</h2>
          <p class="page-subtitle">{{ organizations().length }} organization{{ organizations().length !== 1 ? 's' : '' }} in your hierarchy</p>
        </div>
        @if (isParentOrg()) {
          <button class="btn btn-primary" (click)="openCreateModal()">
            <span class="material-symbols-outlined" style="font-size: 18px">add</span>
            New Organization
          </button>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center" style="padding: 60px">
          <div class="spinner" style="width: 28px; height: 28px"></div>
        </div>
      } @else {
        <div class="org-tree">
          @for (group of orgTree(); track group.parent.id) {
            <div class="tree-group card">
              <!-- Parent node -->
              <div class="tree-node tree-parent clickable" (click)="isParentOrg() ? openEditModal(group.parent) : null">
                <div class="node-icon parent-icon">
                  <span class="material-symbols-outlined">domain</span>
                </div>
                <div class="node-content">
                  <div class="org-name">{{ group.parent.name }}</div>
                  <div class="org-meta">
                    <span class="badge badge-parent">Parent</span>
                    @if (group.children.length > 0) {
                      <span class="child-count">
                        {{ group.children.length }} sub-org{{ group.children.length !== 1 ? 's' : '' }}
                      </span>
                    } @else {
                      <span class="child-count">No sub-organizations</span>
                    }
                  </div>
                </div>
                @if (isParentOrg()) {
                  <span class="row-edit-hint material-symbols-outlined">edit</span>
                }
              </div>

              <!-- Children (always visible) -->
              @if (group.children.length > 0) {
                <div class="tree-children">
                  <div class="children-divider"></div>
                  @for (child of group.children; track child.id; let i = $index) {
                    <div class="tree-node tree-child clickable" [style.animation-delay]="(i * 50) + 'ms'"
                         (click)="isParentOrg() ? openEditModal(child) : null">
                      <div class="node-icon child-icon">
                        <span class="material-symbols-outlined">business</span>
                      </div>
                      <div class="node-content">
                        <div class="org-name">{{ child.name }}</div>
                        <div class="org-meta">
                          <span class="badge badge-child">Sub-org</span>
                        </div>
                      </div>
                      @if (isParentOrg()) {
                        <div class="node-actions-always">
                          <button class="btn btn-ghost btn-icon" (click)="$event.stopPropagation(); confirmDelete(child)" title="Delete">
                            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--color-danger)">delete</span>
                          </button>
                        </div>
                        <span class="row-edit-hint material-symbols-outlined">edit</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (organizations().length === 0) {
          <div class="empty-state">
            <span class="material-symbols-outlined" style="font-size: 48px; color: var(--color-text-muted)">domain_disabled</span>
            <p class="text-muted">No organizations found.</p>
          </div>
        }
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width: 420px">
          <h3 style="margin: 0 0 20px; font-size: 18px; font-weight: 700">
            {{ editingOrg() ? 'Rename Organization' : 'Create Organization' }}
          </h3>
          <form (ngSubmit)="saveOrg()" class="flex flex-col gap-3">
            <div>
              <label class="form-label">Organization Name *</label>
              <input class="form-input" [(ngModel)]="modalName" name="name"
                     required placeholder="e.g. South Office" autofocus
                     [class.input-error]="nameError" (input)="nameError = ''" />
              @if (nameError) {
                <div class="field-error">{{ nameError }}</div>
              }
            </div>
            @if (!editingOrg()) {
              <label class="toggle-row">
                <div class="toggle" [class.toggle-on]="createAsParent" (click)="createAsParent = !createAsParent">
                  <div class="toggle-knob"></div>
                </div>
                <div>
                  <span class="text-sm font-semibold">Create as independent parent</span>
                  <div class="text-xs text-muted" style="margin-top: 2px">
                    {{ createAsParent ? 'This will be a new top-level organization.' : 'This will be a child of your current organization.' }}
                  </div>
                </div>
              </label>
            }
            <div class="flex gap-2 justify-between mt-2">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> }
                {{ editingOrg() ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deleteTarget()) {
      <div class="modal-backdrop" (click)="cancelDelete()">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width: 420px">
          <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700">Delete Organization</h3>
          <p class="text-secondary text-sm" style="margin: 0 0 16px">
            Are you sure you want to delete <strong>{{ deleteTarget()!.name }}</strong>? This will fail if the org still has users, tasks, or categories.
          </p>
          <div style="margin-bottom: 16px">
            <label class="form-label">Type <strong>{{ deleteTarget()!.name }}</strong> to confirm</label>
            <input class="form-input" [(ngModel)]="deleteConfirmName" name="deleteConfirm"
                   placeholder="Organization name" autocomplete="off" />
          </div>
          <div class="flex gap-2 justify-between">
            <button class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
            <button class="btn btn-danger" (click)="doDelete()"
                    [disabled]="saving() || deleteConfirmName !== deleteTarget()!.name">
              @if (saving()) { <span class="spinner"></span> }
              Delete
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .orgs-page {
      padding: 0;
      animation: pageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
    }
    .page-title {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .page-subtitle {
      margin: 4px 0 0;
      font-size: 14px;
      color: var(--color-text-muted);
    }
    .org-tree { display: flex; flex-direction: column; gap: 16px; }

    .tree-group {
      padding: 0 !important;
      overflow: hidden;
    }

    .tree-node {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .tree-node:hover { background: var(--color-bg-tertiary); }



    .parent-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    .parent-icon .material-symbols-outlined { font-size: 24px; }

    .child-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: var(--color-accent-light);
      color: var(--color-accent);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .child-icon .material-symbols-outlined { font-size: 18px; }

    .node-content { flex: 1; min-width: 0; }

    .org-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1.3;
    }
    .org-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }
    .badge-parent {
      background: linear-gradient(135deg, #667eea20, #764ba220);
      color: #667eea;
      font-size: 10px;
      padding: 1px 8px;
    }
    .dark .badge-parent {
      background: rgba(102, 126, 234, 0.2);
      color: #a5b4fc;
    }
    .badge-child {
      background: var(--color-accent-light);
      color: var(--color-accent);
      font-size: 10px;
      padding: 1px 8px;
    }
    .child-count {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .row-edit-hint {
      font-size: 18px;
      color: var(--color-text-muted);
      opacity: 0;
      transition: opacity 0.2s;
      flex-shrink: 0;
    }
    .tree-node:hover .row-edit-hint {
      opacity: 0.5;
    }

    .node-actions-always {
      display: flex; gap: 2px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .tree-node:hover .node-actions-always { opacity: 1; }

    .clickable {
      cursor: pointer;
    }
    .clickable:active {
      background: var(--color-bg-hover);
    }

    /* Collapsible children */
    .tree-children {
      padding: 0 12px 12px;
    }
    .children-divider {
      height: 1px;
      background: var(--color-border);
      margin: 0 8px 8px;
    }
    .tree-child {
      border-radius: 10px;
      margin: 0 0 4px;
      padding: 12px 16px;
      animation: cardStagger 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    /* Toggle switch */
    .toggle-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 8px 0;
    }
    .toggle {
      width: 40px; height: 22px;
      border-radius: 11px;
      background: var(--color-bg-hover);
      border: 1px solid var(--color-border);
      position: relative;
      flex-shrink: 0;
      transition: all 0.2s;
      margin-top: 2px;
      cursor: pointer;
    }
    .toggle-on {
      background: var(--color-accent);
      border-color: var(--color-accent);
    }
    .toggle-knob {
      width: 16px; height: 16px;
      border-radius: 50%;
      background: white;
      position: absolute;
      top: 2px; left: 2px;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .toggle-on .toggle-knob {
      transform: translateX(18px);
    }

    /* Inline validation */
    .input-error {
      border-color: var(--color-danger) !important;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
    }
    .field-error {
      color: var(--color-danger);
      font-size: 12px;
      margin-top: 4px;
      font-weight: 500;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    @media (max-width: 768px) {
      .node-actions, .node-actions-always { opacity: 1; }
      .page-header { flex-direction: column; align-items: stretch; gap: 12px; }
    }
  `],
})
export class OrganizationsComponent implements OnInit {
  organizations = signal<Organization[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editingOrg = signal<Organization | null>(null);
  deleteTarget = signal<Organization | null>(null);
  deleteConfirmName = '';
  modalName = '';
  createAsParent = false;
  nameError = '';

  orgTree = computed<OrgTreeNode[]>(() => {
    const orgs = this.organizations();
    const parents = orgs.filter(o => !o.parentId);
    return parents.map(parent => ({
      parent,
      children: orgs.filter(o => o.parentId === parent.id),
    }));
  });

  constructor(
    private orgService: OrganizationService,
    public authService: AuthService,
    private toast: ToastService,
  ) { }

  ngOnInit() {
    this.load();
  }

  isParentOrg(): boolean {
    const user = this.authService.currentUser();
    return !!user && user.organization && !user.organization.parentId;
  }

  load() {
    this.loading.set(true);
    this.orgService.getOrganizations().subscribe({
      next: (orgs) => {
        this.organizations.set(orgs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateModal() {
    this.editingOrg.set(null);
    this.modalName = '';
    this.createAsParent = false;
    this.nameError = '';
    this.showModal.set(true);
  }

  openEditModal(org: Organization) {
    this.editingOrg.set(org);
    this.modalName = org.name;
    this.nameError = '';
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingOrg.set(null);
    this.nameError = '';
  }

  saveOrg() {
    if (!this.modalName.trim()) {
      this.nameError = 'Organization name is required';
      return;
    }
    this.saving.set(true);
    this.nameError = '';
    const editing = this.editingOrg();

    if (editing) {
      this.orgService.updateOrganization(editing.id, { name: this.modalName.trim() }).subscribe({
        next: () => {
          this.toast.success('Organization renamed');
          this.closeModal();
          this.load();
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed');
          this.saving.set(false);
        },
      });
    } else {
      this.orgService.createOrganization({
        name: this.modalName.trim(),
        parentId: this.createAsParent ? null : this.authService.currentUser()!.organizationId,
      }).subscribe({
        next: () => {
          this.toast.success('Organization created');
          this.closeModal();
          this.load();
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed');
          this.saving.set(false);
        },
      });
    }
  }

  confirmDelete(org: Organization) {
    this.deleteTarget.set(org);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
    this.deleteConfirmName = '';
  }

  doDelete() {
    const org = this.deleteTarget();
    if (!org) return;
    this.saving.set(true);
    this.orgService.deleteOrganization(org.id).subscribe({
      next: () => {
        this.toast.success('Organization deleted');
        this.cancelDelete();
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed');
        this.saving.set(false);
      },
    });
  }
}

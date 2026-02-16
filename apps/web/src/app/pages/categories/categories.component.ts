import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Category, CreateCategoryDto } from '@stms/data';
import { Permission } from '@stms/data';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="categories-page">
      <div class="page-header">
        <h2 class="page-title">Categories</h2>
        @if (canManage()) {
          <button class="btn btn-primary" (click)="openCreateModal()">+ New Category</button>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center" style="padding: 40px"><div class="spinner" style="width: 28px; height: 28px"></div></div>
      } @else {
        <div class="category-list">
          @for (cat of categories(); track cat.id) {
            <div class="card flex items-center justify-between" style="padding: 12px 16px; margin-bottom: 8px">
              <div>
                <span class="text-sm font-semibold">{{ cat.name }}</span>
                @if (cat.organizationId !== authService.currentUser()?.organizationId) {
                  <span class="text-xs text-muted" style="margin-left: 8px">(Shared)</span>
                }
              </div>
              @if (canManage()) {
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-sm" (click)="openEditModal(cat)"><span class="material-symbols-outlined" style="font-size: 16px">edit</span></button>
                  <button class="btn btn-ghost btn-sm" (click)="confirmDelete(cat)"><span class="material-symbols-outlined" style="font-size: 16px">delete</span></button>
                </div>
              }
            </div>
          }
          @if (categories().length === 0) {
            <div class="text-center text-muted" style="padding: 40px">No categories yet.</div>
          }
        </div>
      }
    </div>

    <!-- Create/Edit Category Modal -->
    @if (showModal()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 style="margin: 0 0 20px; font-size: 18px">
            {{ editingCategory() ? 'Edit Category' : 'Create Category' }}
          </h3>
          <form (ngSubmit)="saveCategory()" class="flex flex-col gap-3">
            <div>
              <label class="form-label">Name *</label>
              <input class="form-input" [(ngModel)]="modalName" name="name"
                     required placeholder="Category name" />
            </div>
            <div class="flex gap-2 justify-between mt-2">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> }
                {{ editingCategory() ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deleteTarget()) {
      <app-confirm-dialog
        title="Delete Category"
        [message]="'Are you sure you want to delete <strong>' + deleteTarget()!.name + '</strong>?'"
        confirmLabel="Delete"
        [destructive]="true"
        [loading]="saving()"
        (confirmed)="doDelete()"
        (cancelled)="cancelDelete()"
      />
    }
  `,
  styles: [`
    .categories-page {
      padding: 0;
      animation: pageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .page-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
  `],
})
export class CategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editingCategory = signal<Category | null>(null);
  deleteTarget = signal<Category | null>(null);
  modalName = '';

  constructor(
    private categoryService: CategoryService,
    public authService: AuthService,
    private toast: ToastService,
  ) { }

  ngOnInit() { this.load(); }

  canManage(): boolean {
    return this.authService.hasPermission(Permission.CATEGORY_CREATE);
  }

  load() {
    this.loading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (cats) => { this.categories.set(cats); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openCreateModal() {
    this.editingCategory.set(null);
    this.modalName = '';
    this.showModal.set(true);
  }

  openEditModal(cat: Category) {
    this.editingCategory.set(cat);
    this.modalName = cat.name;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingCategory.set(null);
    this.modalName = '';
  }

  saveCategory() {
    if (!this.modalName.trim()) return;
    this.saving.set(true);
    const editing = this.editingCategory();

    if (editing) {
      this.categoryService.updateCategory(editing.id, { name: this.modalName.trim() }).subscribe({
        next: () => {
          this.toast.success('Category updated');
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
      this.categoryService.createCategory({ name: this.modalName.trim() }).subscribe({
        next: () => {
          this.toast.success('Category created');
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

  confirmDelete(cat: Category) {
    this.deleteTarget.set(cat);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  doDelete() {
    const cat = this.deleteTarget();
    if (!cat) return;
    this.saving.set(true);
    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.toast.success('Category deleted');
        this.deleteTarget.set(null);
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed');
        this.saving.set(false);
      },
    });
  }
}

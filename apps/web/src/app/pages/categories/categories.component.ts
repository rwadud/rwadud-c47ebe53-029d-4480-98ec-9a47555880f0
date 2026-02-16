import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ICategory, CreateCategoryDto } from '@stms/data';
import { Permission } from '@stms/auth';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="categories-page">
      <div class="flex items-center justify-between mb-4">
        <h2 class="page-title" style="margin: 0;">Categories</h2>
        @if (canManage()) {
          <button class="btn btn-primary" (click)="showAdd = true">+ New Category</button>
        }
      </div>

      @if (showAdd && canManage()) {
        <div class="card mb-4 flex gap-2 items-center" style="padding: 12px 16px">
          <input class="form-input" [(ngModel)]="newName" placeholder="Category name" style="flex: 1"
                 (keyup.enter)="addCategory()" />
          <button class="btn btn-primary btn-sm" (click)="addCategory()" [disabled]="saving()">Add</button>
          <button class="btn btn-secondary btn-sm" (click)="showAdd = false; newName = ''">Cancel</button>
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center" style="padding: 40px"><div class="spinner" style="width: 28px; height: 28px"></div></div>
      } @else {
        <div class="category-list">
          @for (cat of categories(); track cat.id) {
            <div class="card flex items-center justify-between" style="padding: 12px 16px; margin-bottom: 8px">
              @if (editingId() === cat.id && canManage()) {
                <input class="form-input" [(ngModel)]="editName" style="flex: 1; margin-right: 8px"
                       (keyup.enter)="updateCategory(cat.id)" />
                <button class="btn btn-primary btn-sm mr-2" (click)="updateCategory(cat.id)">Save</button>
                <button class="btn btn-secondary btn-sm" (click)="editingId.set(0)">Cancel</button>
              } @else {
                <div>
                  <span class="text-sm font-semibold">{{ cat.name }}</span>
                  @if (cat.organizationId !== authService.currentUser()?.organizationId) {
                    <span class="text-xs text-muted" style="margin-left: 8px">(Shared)</span>
                  }
                </div>
                @if (canManage()) {
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-sm" (click)="startEdit(cat)"><span class="material-symbols-outlined" style="font-size: 16px">edit</span></button>
                    <button class="btn btn-ghost btn-sm" (click)="deleteCategory(cat.id)"><span class="material-symbols-outlined" style="font-size: 16px">delete</span></button>
                  </div>
                }
              }
            </div>
          }
          @if (categories().length === 0) {
            <div class="text-center text-muted" style="padding: 40px">No categories yet.</div>
          }
        </div>
      }
    </div>
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
  categories = signal<ICategory[]>([]);
  loading = signal(true);
  saving = signal(false);
  editingId = signal(0);
  editName = '';
  newName = '';
  showAdd = false;

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

  addCategory() {
    if (!this.newName.trim()) return;
    this.saving.set(true);
    this.categoryService.createCategory({ name: this.newName.trim() }).subscribe({
      next: () => {
        this.toast.success('Category created');
        this.newName = '';
        this.showAdd = false;
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed');
        this.saving.set(false);
      },
    });
  }

  startEdit(cat: ICategory) {
    this.editingId.set(cat.id);
    this.editName = cat.name;
  }

  updateCategory(id: number) {
    if (!this.editName.trim()) return;
    this.categoryService.updateCategory(id, { name: this.editName.trim() }).subscribe({
      next: () => {
        this.toast.success('Category updated');
        this.editingId.set(0);
        this.load();
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed'),
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Delete this category?')) return;
    this.categoryService.deleteCategory(id).subscribe({
      next: () => { this.toast.success('Category deleted'); this.load(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed'),
    });
  }
}

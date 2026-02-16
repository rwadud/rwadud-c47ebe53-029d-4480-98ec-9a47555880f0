import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { OrganizationService } from '../../services/organization.service';
import { ToastService } from '../../services/toast.service';
import { Task, Category, Organization, TaskStatus, TaskPriority } from '@stms/data';
import { Permission } from '@stms/data';
import { TaskCardComponent } from '../../components/task-card/task-card.component';
import { TaskFormModalComponent, TaskFormResult } from '../../components/task-modal/task-modal.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { TaskProgressBarComponent } from '../../components/task-progress-bar/task-progress-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskCardComponent, TaskFormModalComponent, ConfirmDialogComponent, TaskProgressBarComponent],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <div class="filters-left">
          <h2 class="page-title">Task Board</h2>
          <span class="task-count text-muted text-sm">{{ allTasks().length }} tasks</span>
        </div>
        @if (canCreateTask()) {
          <button class="btn btn-primary" (click)="openCreateModal()">
            + New Task
          </button>
        }
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
          @if (organizations().length > 1) {
            <select class="form-input form-select filter-select"
                    [(ngModel)]="filterOrg"
                    (ngModelChange)="applyFilters()">
              <option value="">All Organizations</option>
              @for (org of organizations(); track org.id) {
                <option [value]="org.id">{{ org.name }}</option>
              }
            </select>
          }
          <select class="form-input form-select filter-select"
                  [(ngModel)]="filterCategory"
                  (ngModelChange)="applyFilters()">
            <option value="">All Categories</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
          <select class="form-input form-select filter-select"
                  [(ngModel)]="filterPriority"
                  (ngModelChange)="applyFilters()">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
      </div>

      <!-- Task Completion Visualization -->
      @if (!loading() && allTasks().length > 0) {
        <app-task-progress-bar [tasks]="filteredTasks()" />
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex justify-center items-center" style="padding: 80px 0">
          <div class="spinner" style="width: 32px; height: 32px"></div>
        </div>
      } @else {
        <!-- Kanban Board -->
        <div class="kanban-board">
          @for (column of columns; track column.status) {
            <div class="kanban-column">
              <div class="column-header">
                <div class="column-title">
                  <span class="column-dot" [style.background]="column.color"></span>
                  {{ column.label }}
                </div>
                <span class="column-count">{{ getColumnTasks(column.status).length }}</span>
              </div>
              <div
                class="column-body"
                cdkDropList
                [cdkDropListData]="getColumnTasks(column.status)"
                [id]="column.status"
                [cdkDropListConnectedTo]="getConnectedLists(column.status)"
                (cdkDropListDropped)="onDrop($event, column.status)"
                [cdkDropListDisabled]="!canDragDrop()"
              >
                @for (task of getColumnTasks(column.status); track task.id) {
                  <div class="task-card card card-interactive"
                       [cdkDragDisabled]="!canDragDrop()"
                       cdkDrag [cdkDragData]="task">
                    <app-task-card
                      [task]="task"
                      [canEdit]="canEditThisTask(task)"
                      [canDelete]="canDeleteThisTask(task)"
                      (edit)="openEditModal($event)"
                      (delete)="confirmDelete($event)"
                    />
                  </div>
                }
                @if (getColumnTasks(column.status).length === 0) {
                  <div class="column-empty text-muted text-sm">
                    No tasks
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal()) {
      <app-task-form-modal
        [task]="editingTask()"
        [categories]="categories()"
        [organizations]="organizations()"
        [saving]="saving()"
        [defaultOrganizationId]="authService.currentUser()?.organizationId ?? null"
        (save)="onTaskFormSave($event)"
        (cancel)="closeModal()"
      />
    }

    <!-- Delete Confirmation Modal -->
    @if (deleteTarget()) {
      <app-confirm-dialog
        title="Delete Task"
        [message]="'Are you sure you want to delete &quot;' + deleteTarget()!.title + '&quot;? This cannot be undone.'"
        confirmLabel="Delete"
        [destructive]="true"
        [loading]="saving()"
        (confirmed)="doDelete()"
        (cancelled)="cancelDelete()"
      />
    }
  `,
  styles: [`
    .dashboard {
      padding: 0;
      animation: pageFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .filters-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 28px;
    }
    .filters-left {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .page-title {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .filter-select {
      width: auto;
      min-width: 146px;
      padding: 8px 32px 8px 12px;
      font-size: 13px;
      border-radius: 10px;
      background-color: var(--color-bg-secondary);
    }
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      min-height: 400px;
    }
    .kanban-column {
      background: var(--kanban-column-bg);
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      min-height: 300px;
      border: 1px solid var(--color-border);
    }
    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 12px;
    }
    .column-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--color-text-secondary);
    }
    .column-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      box-shadow: 0 0 6px currentColor;
    }
    .column-count {
      background: var(--color-bg-secondary);
      padding: 2px 10px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 700;
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);
    }
    .column-body {
      flex: 1;
      padding: 4px 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 60px;
    }
    .column-empty {
      text-align: center;
      padding: 40px 16px;
      opacity: 0.5;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .task-card {
      cursor: grab;
      border-left: 3px solid transparent;
      transition: box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease;
    }
    .task-card:active { cursor: grabbing; }
    .task-card:hover {
      border-left-color: var(--color-accent);
    }
    @media (max-width: 768px) {
      .kanban-board {
        grid-template-columns: 1fr;
      }
      .filters-bar { flex-direction: column; align-items: stretch; }
      .filters-right { flex-direction: column; }
      .filter-select { width: 100%; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  allTasks = signal<Task[]>([]);
  filteredTasks = signal<Task[]>([]);
  categories = signal<Category[]>([]);
  organizations = signal<Organization[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editingTask = signal<Task | null>(null);
  deleteTarget = signal<Task | null>(null);

  filterCategory = '';
  filterPriority = '';
  filterOrg = '';

  columns = [
    { status: TaskStatus.TODO, label: 'To Do', color: '#94a3b8' },
    { status: TaskStatus.IN_PROGRESS, label: 'In Progress', color: '#3b82f6' },
    { status: TaskStatus.DONE, label: 'Done', color: '#10b981' },
  ];

  canCreateTask = computed(() => this.authService.hasPermission(Permission.TASK_CREATE));

  constructor(
    public authService: AuthService,
    private taskService: TaskService,
    private categoryService: CategoryService,
    private orgService: OrganizationService,
    private toast: ToastService,
  ) { }

  // Keyboard shortcuts: N = new task, Escape = close modal/dialog
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    // Don't trigger shortcuts when typing in inputs
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    if (event.key === 'Escape') {
      if (this.deleteTarget()) {
        this.cancelDelete();
      } else if (this.showModal()) {
        this.closeModal();
      }
    } else if (event.key === 'n' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (!this.showModal() && !this.deleteTarget() && this.canCreateTask()) {
        event.preventDefault();
        this.openCreateModal();
      }
    }
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => { },
    });
    this.orgService.getOrganizations().subscribe({
      next: (orgs) => this.organizations.set(orgs),
      error: () => { },
    });
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks.set(tasks);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load tasks');
        this.loading.set(false);
      },
    });
  }

  applyFilters() {
    let tasks = this.allTasks();
    if (this.filterCategory) {
      tasks = tasks.filter((t) => t.categoryId === Number(this.filterCategory));
    }
    if (this.filterPriority) {
      tasks = tasks.filter((t) => t.priority === this.filterPriority);
    }
    if (this.filterOrg) {
      tasks = tasks.filter((t) => t.organizationId === Number(this.filterOrg));
    }
    this.filteredTasks.set(tasks);
  }

  getColumnTasks(status: TaskStatus): Task[] {
    return this.filteredTasks().filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  }

  getConnectedLists(currentStatus: string): string[] {
    return this.columns.map((c) => c.status).filter((s) => s !== currentStatus);
  }

  canDragDrop(): boolean {
    return this.authService.hasPermission(Permission.TASK_CREATE);
  }

  canEditThisTask(task: Task): boolean {
    return this.authService.canEditTask(task.createdById);
  }

  canDeleteThisTask(task: Task): boolean {
    return this.authService.canDeleteTask(task.createdById);
  }

  onDrop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus) {
    if (!this.canDragDrop()) return;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }

    const reorderItems = event.container.data.map((task, idx) => ({
      taskId: task.id,
      newPosition: idx,
      newStatus: newStatus,
    }));

    event.container.data.forEach((task, idx) => {
      task.status = newStatus;
      task.position = idx;
    });
    this.filteredTasks.set([...this.filteredTasks()]);

    this.taskService.reorderTasks(reorderItems).subscribe({
      error: () => this.toast.error('Failed to reorder'),
    });
  }

  openCreateModal() {
    this.editingTask.set(null);
    this.showModal.set(true);
  }

  openEditModal(task: Task) {
    this.editingTask.set(task);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingTask.set(null);
  }

  onTaskFormSave(result: TaskFormResult) {
    this.saving.set(true);
    const editing = this.editingTask();

    if (result.mode === 'update' && editing && result.updateDto) {
      this.taskService.updateTask(editing.id, result.updateDto).subscribe({
        next: () => {
          this.toast.success('Task updated');
          this.closeModal();
          this.loadData();
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to update task');
          this.saving.set(false);
        },
      });
    } else if (result.mode === 'create' && result.createDto) {
      this.taskService.createTask(result.createDto).subscribe({
        next: () => {
          this.toast.success('Task created');
          this.closeModal();
          this.loadData();
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to create task');
          this.saving.set(false);
        },
      });
    }
  }

  confirmDelete(task: Task) {
    this.deleteTarget.set(task);
  }

  cancelDelete() {
    this.deleteTarget.set(null);
  }

  doDelete() {
    const task = this.deleteTarget();
    if (!task) return;
    this.saving.set(true);
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.toast.success('Task deleted');
        this.cancelDelete();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete task');
        this.saving.set(false);
      },
    });
  }
}

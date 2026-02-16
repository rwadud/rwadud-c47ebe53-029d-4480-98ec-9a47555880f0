import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { CategoryService } from '../../services/category.service';
import { OrganizationService } from '../../services/organization.service';
import { ToastService } from '../../services/toast.service';
import { ITask, ICategory, IOrganization, TaskStatus, TaskPriority, CreateTaskDto, UpdateTaskDto } from '@stms/data';
import { Permission } from '@stms/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="dashboard">
      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="filters-left">
          <h2 class="page-title">Task Board</h2>
          <span class="task-count text-muted text-sm">{{ allTasks().length }} tasks</span>
        </div>
        <div class="filters-right">
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
          @if (canCreateTask()) {
            <button class="btn btn-primary" (click)="openCreateModal()">
              + New Task
            </button>
          }
        </div>
      </div>

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
                    <div class="task-header">
                      <span class="badge" [class]="'badge-' + task.priority">
                        {{ task.priority }}
                      </span>
                      @if (task.category) {
                        <span class="task-category text-xs text-muted">{{ task.category.name }}</span>
                      }
                    </div>
                    <h4 class="task-title">{{ task.title }}</h4>
                    @if (task.description) {
                      <p class="task-desc text-sm text-secondary">{{ task.description }}</p>
                    }
                    @if (task.dueDate) {
                      <div class="task-due" [class.overdue]="isOverdue(task.dueDate)">
                        <span class="material-symbols-outlined" style="font-size: 14px">calendar_today</span> {{ formatDate(task.dueDate) }}
                      </div>
                    }
                    <div class="task-footer">
                      <div class="task-meta">
                        @if (task.createdBy) {
                          <span class="text-xs text-muted">{{ task.createdBy.name }}</span>
                        }
                        @if (task.organization) {
                          <span class="text-xs text-muted hide-mobile">{{ task.organization.name }}</span>
                        }
                      </div>
                      <div class="task-actions">
                        @if (canEditThisTask(task)) {
                          <button class="btn btn-ghost btn-icon btn-sm" title="Edit" (click)="openEditModal(task)">
                            <span class="material-symbols-outlined" style="font-size: 16px">edit</span>
                          </button>
                        }
                        @if (canDeleteThisTask(task)) {
                          <button class="btn btn-ghost btn-icon btn-sm" title="Delete" (click)="confirmDelete(task)">
                            <span class="material-symbols-outlined" style="font-size: 16px">delete</span>
                          </button>
                        }
                      </div>
                    </div>
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
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 style="margin: 0 0 20px; font-size: 18px">
            {{ editingTask() ? 'Edit Task' : 'Create Task' }}
          </h3>
          <form (ngSubmit)="saveTask()" class="flex flex-col gap-3">
            <div>
              <label class="form-label">Title *</label>
              <input class="form-input" [(ngModel)]="modalData.title" name="title" required placeholder="Task title"/>
            </div>
            <div>
              <label class="form-label">Description</label>
              <textarea class="form-input" [(ngModel)]="modalData.description" name="desc" rows="3" placeholder="Optional description"></textarea>
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="form-label">Status</label>
                <select class="form-input form-select" [(ngModel)]="modalData.status" name="status">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="form-label">Priority</label>
                <select class="form-input form-select" [(ngModel)]="modalData.priority" name="priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div class="flex gap-3">
              <div class="flex-1">
                <label class="form-label">Category</label>
                <select class="form-input form-select" [(ngModel)]="modalData.categoryId" name="category">
                  <option [ngValue]="null">No Category</option>
                  @for (cat of categories(); track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
              <div class="flex-1">
                <label class="form-label">Due Date</label>
                <input class="form-input" type="date" [(ngModel)]="modalData.dueDate" name="dueDate" />
              </div>
            </div>
            @if (!editingTask() && organizations().length > 1) {
              <div>
                <label class="form-label">Organization</label>
                <select class="form-input form-select" [(ngModel)]="modalData.organizationId" name="org">
                  @for (org of organizations(); track org.id) {
                    <option [ngValue]="org.id">{{ org.name }}</option>
                  }
                </select>
                <div class="text-xs text-muted" style="margin-top: 4px">
                  Assign this task to a specific organization
                </div>
              </div>
            }
            <div class="flex gap-2 justify-between mt-2">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) {
                  <span class="spinner"></span>
                }
                {{ editingTask() ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deleteTarget()) {
      <div class="modal-backdrop" (click)="cancelDelete()">
        <div class="modal" (click)="$event.stopPropagation()" style="max-width: 400px">
          <h3 style="margin: 0 0 8px; font-size: 18px;">Delete Task</h3>
          <p class="text-secondary text-sm" style="margin: 0 0 20px">
            Are you sure you want to delete "{{ deleteTarget()!.title }}"? This cannot be undone.
          </p>
          <div class="flex gap-2 justify-between">
            <button class="btn btn-secondary" (click)="cancelDelete()">Cancel</button>
            <button class="btn btn-danger" (click)="doDelete()" [disabled]="saving()">
              @if (saving()) { <span class="spinner"></span> }
              Delete
            </button>
          </div>
        </div>
      </div>
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
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 28px;
    }
    .filters-left {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .filters-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
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
      border: 1px solid rgba(226, 232, 240, 0.4);
    }
    .dark .kanban-column { border-color: rgba(51, 65, 85, 0.3); }
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
    .task-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .task-title {
      margin: 0 0 4px;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
    }
    .task-desc {
      margin: 0 0 8px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .task-due {
      font-size: 12px;
      color: var(--color-text-muted);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .task-due.overdue {
      color: var(--color-danger);
      font-weight: 600;
    }
    .task-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--color-border);
      margin-top: 4px;
    }
    .task-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .task-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .task-card:hover .task-actions { opacity: 1; }
    @media (max-width: 768px) {
      .kanban-board {
        grid-template-columns: 1fr;
      }
      .filters-bar { flex-direction: column; align-items: stretch; }
      .filters-right { flex-direction: column; }
      .filter-select { width: 100%; }
      .task-actions { opacity: 1; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  allTasks = signal<ITask[]>([]);
  filteredTasks = signal<ITask[]>([]);
  categories = signal<ICategory[]>([]);
  organizations = signal<IOrganization[]>([]);
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editingTask = signal<ITask | null>(null);
  deleteTarget = signal<ITask | null>(null);

  filterCategory = '';
  filterPriority = '';
  filterOrg = '';

  modalData = {
    title: '',
    description: '',
    status: 'todo' as string,
    priority: 'medium' as string,
    categoryId: null as number | null,
    dueDate: '' as string,
    organizationId: null as number | null,
  };

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

  getColumnTasks(status: TaskStatus): ITask[] {
    return this.filteredTasks().filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  }

  getConnectedLists(currentStatus: string): string[] {
    return this.columns.map((c) => c.status).filter((s) => s !== currentStatus);
  }

  canDragDrop(): boolean {
    return this.authService.hasPermission(Permission.TASK_CREATE);
  }

  canEditThisTask(task: ITask): boolean {
    return this.authService.canEditTask(task.createdById);
  }

  canDeleteThisTask(task: ITask): boolean {
    return this.authService.canDeleteTask(task.createdById);
  }

  onDrop(event: CdkDragDrop<ITask[]>, newStatus: TaskStatus) {
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
    this.modalData = {
      title: '', description: '', status: 'todo',
      priority: 'medium', categoryId: null, dueDate: '',
      organizationId: this.authService.currentUser()?.organizationId ?? null,
    };
    this.showModal.set(true);
  }

  openEditModal(task: ITask) {
    this.editingTask.set(task);
    this.modalData = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      categoryId: task.categoryId,
      dueDate: task.dueDate || '',
      organizationId: task.organizationId,
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingTask.set(null);
  }

  saveTask() {
    if (!this.modalData.title.trim()) {
      this.toast.error('Title is required');
      return;
    }

    this.saving.set(true);
    const editing = this.editingTask();

    if (editing) {
      const dto: UpdateTaskDto = {
        title: this.modalData.title,
        description: this.modalData.description,
        status: this.modalData.status as TaskStatus,
        priority: this.modalData.priority as TaskPriority,
        categoryId: this.modalData.categoryId,
        dueDate: this.modalData.dueDate || null,
      };
      this.taskService.updateTask(editing.id, dto).subscribe({
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
    } else {
      const dto: CreateTaskDto = {
        title: this.modalData.title,
        description: this.modalData.description,
        status: this.modalData.status as TaskStatus,
        priority: this.modalData.priority as TaskPriority,
        categoryId: this.modalData.categoryId,
        dueDate: this.modalData.dueDate || null,
        organizationId: this.modalData.organizationId ?? undefined,
      };
      this.taskService.createTask(dto).subscribe({
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

  confirmDelete(task: ITask) {
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

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}

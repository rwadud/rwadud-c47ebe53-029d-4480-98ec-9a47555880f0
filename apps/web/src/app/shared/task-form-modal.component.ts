import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ITask, ICategory, IOrganization, TaskStatus, TaskPriority, CreateTaskDto, UpdateTaskDto } from '@stms/data';

export interface TaskFormResult {
  mode: 'create' | 'update';
  createDto?: CreateTaskDto;
  updateDto?: UpdateTaskDto;
}

@Component({
  selector: 'app-task-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="cancel.emit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3 style="margin: 0 0 20px; font-size: 18px">
          {{ task ? 'Edit Task' : 'Create Task' }}
        </h3>
        <form (ngSubmit)="onSubmit()" class="flex flex-col gap-3">
          <div>
            <label class="form-label">Title *</label>
            <input class="form-input" [(ngModel)]="formData.title" name="title" required placeholder="Task title"/>
          </div>
          <div>
            <label class="form-label">Description</label>
            <textarea class="form-input" [(ngModel)]="formData.description" name="desc" rows="3" placeholder="Optional description"></textarea>
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="form-label">Status</label>
              <select class="form-input form-select" [(ngModel)]="formData.status" name="status">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div class="flex-1">
              <label class="form-label">Priority</label>
              <select class="form-input form-select" [(ngModel)]="formData.priority" name="priority">
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
              <select class="form-input form-select" [(ngModel)]="formData.categoryId" name="category">
                <option [ngValue]="null">No Category</option>
                @for (cat of categories; track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            <div class="flex-1">
              <label class="form-label">Due Date</label>
              <input class="form-input" type="date" [(ngModel)]="formData.dueDate" name="dueDate" />
            </div>
          </div>
          @if (!task && organizations.length > 1) {
            <div>
              <label class="form-label">Organization</label>
              <select class="form-input form-select" [(ngModel)]="formData.organizationId" name="org">
                @for (org of organizations; track org.id) {
                  <option [ngValue]="org.id">{{ org.name }}</option>
                }
              </select>
              <div class="text-xs text-muted" style="margin-top: 4px">
                Assign this task to a specific organization
              </div>
            </div>
          }
          <div class="flex gap-2 justify-between mt-2">
            <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving">
              @if (saving) {
                <span class="spinner"></span>
              }
              {{ task ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class TaskFormModalComponent implements OnInit {
  @Input() task: ITask | null = null;
  @Input() categories: ICategory[] = [];
  @Input() organizations: IOrganization[] = [];
  @Input() saving = false;
  @Input() defaultOrganizationId: number | null = null;

  @Output() save = new EventEmitter<TaskFormResult>();
  @Output() cancel = new EventEmitter<void>();

  formData = {
    title: '',
    description: '',
    status: 'todo' as string,
    priority: 'medium' as string,
    categoryId: null as number | null,
    dueDate: '' as string,
    organizationId: null as number | null,
  };

  ngOnInit() {
    if (this.task) {
      this.formData = {
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        priority: this.task.priority,
        categoryId: this.task.categoryId,
        dueDate: this.task.dueDate || '',
        organizationId: this.task.organizationId,
      };
    } else {
      this.formData.organizationId = this.defaultOrganizationId;
    }
  }

  onSubmit() {
    if (!this.formData.title.trim()) return;

    if (this.task) {
      const dto: UpdateTaskDto = {
        title: this.formData.title,
        description: this.formData.description,
        status: this.formData.status as TaskStatus,
        priority: this.formData.priority as TaskPriority,
        categoryId: this.formData.categoryId,
        dueDate: this.formData.dueDate || null,
      };
      this.save.emit({ mode: 'update', updateDto: dto });
    } else {
      const dto: CreateTaskDto = {
        title: this.formData.title,
        description: this.formData.description,
        status: this.formData.status as TaskStatus,
        priority: this.formData.priority as TaskPriority,
        categoryId: this.formData.categoryId,
        dueDate: this.formData.dueDate || null,
        organizationId: this.formData.organizationId ?? undefined,
      };
      this.save.emit({ mode: 'create', createDto: dto });
    }
  }
}

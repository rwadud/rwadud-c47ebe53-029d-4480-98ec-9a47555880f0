import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITask } from '@stms/data';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
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
        <span class="material-symbols-outlined" style="font-size: 14px">calendar_today</span>
        {{ formatDate(task.dueDate) }}
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
        @if (canEdit) {
          <button class="btn btn-ghost btn-icon btn-sm" title="Edit" (click)="edit.emit(task)">
            <span class="material-symbols-outlined" style="font-size: 16px">edit</span>
          </button>
        }
        @if (canDelete) {
          <button class="btn btn-ghost btn-icon btn-sm" title="Delete" (click)="delete.emit(task)">
            <span class="material-symbols-outlined" style="font-size: 16px">delete</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
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
    :host(:hover) .task-actions { opacity: 1; }
    @media (max-width: 768px) {
      .task-actions { opacity: 1; }
    }
  `],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: ITask;
  @Input() canEdit = false;
  @Input() canDelete = false;

  @Output() edit = new EventEmitter<ITask>();
  @Output() delete = new EventEmitter<ITask>();

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}

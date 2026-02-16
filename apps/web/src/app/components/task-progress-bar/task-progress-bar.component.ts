import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskStatus } from '@stms/data';

@Component({
  selector: 'app-task-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-section">
      <div class="progress-header">
        <span class="progress-label">Completion</span>
        <span class="progress-stats">{{ doneCount() }} / {{ total() }} done</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill"
             [style.width.%]="donePercent()"
             [attr.title]="doneCount() + ' of ' + total() + ' tasks completed'"></div>
      </div>
    </div>
  `,
  styles: [`
    .progress-section {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 20px;
      animation: pageFadeIn 0.5s ease;
    }
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .progress-label {
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--color-text-secondary);
    }
    .progress-stats {
      font-weight: 700;
      font-size: 13px;
      color: #10b981;
    }
    .progress-bar {
      height: 10px;
      border-radius: 100px;
      overflow: hidden;
      background: var(--color-border);
    }
    .progress-fill {
      height: 100%;
      border-radius: 100px;
      background: #10b981;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `],
})
export class TaskProgressBarComponent {
  tasks = input.required<Task[]>();

  total = computed(() => this.tasks().length);
  doneCount = computed(() => this.tasks().filter(t => t.status === TaskStatus.DONE).length);
  donePercent = computed(() => {
    const t = this.total();
    return t === 0 ? 0 : Math.round((this.doneCount() / t) * 100);
  });
}

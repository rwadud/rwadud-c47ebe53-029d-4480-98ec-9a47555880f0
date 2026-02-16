import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="cancelled.emit()">
      <div class="modal" (click)="$event.stopPropagation()" style="max-width: 400px">
        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700">{{ title }}</h3>
        <p class="text-secondary text-sm" style="margin: 0 0 20px" [innerHTML]="message"></p>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-secondary" (click)="cancelled.emit()">Cancel</button>
          <button
            class="btn"
            [class.btn-danger]="destructive"
            [class.btn-primary]="!destructive"
            (click)="confirmed.emit()"
            [disabled]="loading"
          >
            @if (loading) { <span class="spinner"></span> }
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() destructive = true;
  @Input() loading = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}

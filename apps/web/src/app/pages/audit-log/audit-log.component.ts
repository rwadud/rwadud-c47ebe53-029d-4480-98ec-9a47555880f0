import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLog } from '@stms/data';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-page">
      <h2 class="page-title">Audit Log</h2>

      @if (loading()) {
        <div class="flex justify-center" style="padding: 60px">
          <div class="spinner" style="width: 32px; height: 32px"></div>
        </div>
      } @else {
        <!-- Desktop Table -->
        <div class="audit-table-wrap desktop-only">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Resource</th>
                <th>User</th>
                <th>Details</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs(); track log.id) {
                <tr>
                  <td>
                    <span class="badge" [class]="getActionClass(log.action)">{{ log.action }}</span>
                  </td>
                  <td class="text-sm">{{ log.resource }} #{{ log.resourceId }}</td>
                  <td class="text-sm">{{ log.user?.name || 'Unknown' }}</td>
                  <td class="text-sm text-secondary">{{ formatDetails(log.details) }}</td>
                  <td class="text-xs text-muted">{{ formatTime(log.timestamp) }}</td>
                </tr>
              }
              @if (logs().length === 0) {
                <tr>
                  <td colspan="5" class="text-center text-muted" style="padding: 40px">
                    No audit log entries yet.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Card List -->
        <div class="audit-cards mobile-only">
          @for (log of logs(); track log.id) {
            <div class="audit-card card">
              <div class="audit-card-header">
                <span class="badge" [class]="getActionClass(log.action)">{{ log.action }}</span>
                <span class="text-xs text-muted">{{ formatTime(log.timestamp) }}</span>
              </div>
              <div class="audit-card-body">
                <span class="audit-card-resource">{{ log.resource }} #{{ log.resourceId }}</span>
                <span class="text-sm text-muted">by {{ log.user?.name || 'Unknown' }}</span>
              </div>
              @if (formatDetails(log.details) !== '\u2014') {
                <div class="audit-card-details text-sm text-secondary">
                  {{ formatDetails(log.details) }}
                </div>
              }
            </div>
          }
          @if (logs().length === 0) {
            <div class="text-center text-muted" style="padding: 40px">No audit log entries yet.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .audit-page {
      padding: 0;
      animation: pageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .page-title {
      margin: 0 0 20px;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    /* --- Desktop Table --- */
    .desktop-only { display: block; }
    .mobile-only { display: none; }
    .audit-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: 14px;
      background: var(--color-bg-secondary);
      box-shadow: var(--color-card-shadow);
    }
    .audit-table {
      width: 100%;
      border-collapse: collapse;
    }
    .audit-table th {
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
    .audit-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }
    .audit-table tbody tr:last-child td { border-bottom: none; }
    .audit-table tbody tr {
      transition: background 0.2s ease;
    }
    .audit-table tbody tr:hover {
      background: var(--color-bg-tertiary);
    }
    /* --- Mobile Cards --- */
    .audit-cards {
      flex-direction: column;
      gap: 10px;
    }
    .audit-card {
      padding: 14px 16px;
      border-radius: 12px;
    }
    .audit-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .audit-card-body {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .audit-card-resource {
      font-weight: 600;
      font-size: 14px;
      color: var(--color-text-primary);
    }
    .audit-card-details {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--color-border);
      line-height: 1.5;
      word-break: break-word;
    }
    @media (max-width: 768px) {
      .desktop-only { display: none !important; }
      .mobile-only { display: flex !important; }
    }
  `],
})
export class AuditLogComponent implements OnInit {
  logs = signal<AuditLog[]>([]);
  loading = signal(true);

  constructor(private auditLogService: AuditLogService) { }

  ngOnInit() {
    this.auditLogService.getAuditLogs().subscribe({
      next: (data: AuditLog[]) => {
        this.logs.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'create': return 'badge-done';
      case 'update': return 'badge-in-progress';
      case 'delete': return 'badge-high';
      default: return 'badge-todo';
    }
  }

  formatDetails(details: string): string {
    try {
      const parsed = JSON.parse(details);
      if (!parsed || typeof parsed !== 'object') return details || '\u2014';
      return Object.entries(parsed)
        .map(([k, v]) => {
          if (v === null || v === undefined) return `${k}: \u2014`;
          if (typeof v === 'object') {
            return `${k}: ${JSON.stringify(v)}`;
          }
          return `${k}: ${v}`;
        })
        .join(' \u00b7 ');
    } catch {
      return details || '\u2014';
    }
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
}

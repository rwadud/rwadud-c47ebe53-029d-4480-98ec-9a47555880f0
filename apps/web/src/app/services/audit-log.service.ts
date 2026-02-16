import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuditLog } from '@stms/data';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly apiUrl = '/api/audit-log';

  constructor(private http: HttpClient) { }

  getAuditLogs() {
    return this.http.get<AuditLog[]>(this.apiUrl);
  }
}

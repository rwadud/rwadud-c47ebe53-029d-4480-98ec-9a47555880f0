import { SetMetadata } from '@nestjs/common';
import { AuditResource, AuditAction } from '@stms/data';

export const AUDITABLE_KEY = 'auditable';

export interface AuditableMetadata {
  resource: AuditResource;
  action: AuditAction;
}

/**
 * Decorator to mark a controller method for automatic audit logging.
 * Usage: @Auditable({ resource: AuditResource.TASK, action: AuditAction.CREATE })
 */
export const Auditable = (metadata: AuditableMetadata) =>
  SetMetadata(AUDITABLE_KEY, metadata);

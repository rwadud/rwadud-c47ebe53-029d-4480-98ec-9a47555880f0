import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDITABLE_KEY, AuditableMetadata } from '@stms/auth';
import { TokenPayload } from '@stms/data';
import { AuditLogService } from '../../audit-log/audit-log.service';

/**
 * Interceptor that automatically creates audit log entries for
 * controller methods decorated with @Auditable().
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<AuditableMetadata>(
      AUDITABLE_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user: TokenPayload = request.user;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          const resourceId = result?.id || request.params?.id || 0;
          await this.auditLogService.log(
            metadata.action,
            metadata.resource,
            Number(resourceId),
            user.sub,
            user.organizationId,
            request.body || {},
          );
        } catch (error) {
          this.logger.error('Failed to create audit log entry', error);
        }
      }),
    );
  }
}

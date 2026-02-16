import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../guards/rbac.guard';
import { RequirePermissions } from '../guards/permissions.decorator';
import { Permission } from '@stms/auth';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) { }

  @Get()
  @RequirePermissions(Permission.AUDIT_VIEW)
  findAll(@Request() req: any) {
    return this.auditLogService.findAll(req.user);
  }
}

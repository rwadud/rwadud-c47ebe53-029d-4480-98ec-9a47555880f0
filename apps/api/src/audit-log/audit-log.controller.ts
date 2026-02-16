import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard, RbacGuard, RequirePermissions } from '@stms/auth';
import { Permission } from '@stms/data';

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

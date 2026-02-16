import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { Organization } from '../organizations/organization.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { OrgScopeService } from '../common/services/org-scope.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Organization])],
  controllers: [AuditLogController],
  providers: [AuditLogService, OrgScopeService],
  exports: [AuditLogService],
})
export class AuditLogModule { }

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditAction, AuditResource, ITokenPayload } from '@stms/data';
import { OrgScopeService } from '../guards/org-scope.service';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    private readonly orgScopeService: OrgScopeService,
  ) { }

  async log(
    action: AuditAction,
    resource: AuditResource,
    resourceId: number,
    userId: number,
    organizationId: number,
    details?: Record<string, unknown>,
  ): Promise<void> {
    const entry = this.auditLogRepo.create({
      action,
      resource,
      resourceId,
      userId,
      organizationId,
      details: JSON.stringify(details || {}),
    });
    await this.auditLogRepo.save(entry);
  }

  async findAll(user: ITokenPayload) {
    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);
    return this.auditLogRepo.find({
      where: { organizationId: In(orgIds) },
      relations: ['user'],
      order: { timestamp: 'DESC', id: 'DESC' },
      take: 100,
    });
  }
}

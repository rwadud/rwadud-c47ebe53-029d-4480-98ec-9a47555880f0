import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from './task.entity';
import {
  CreateTaskDto, UpdateTaskDto, ReorderTaskDto,
  ITokenPayload, AuditAction, AuditResource, TaskStatus,
} from '@stms/data';
import { Permission, hasPermission } from '@stms/data';
import { OrgScopeService } from '../common/services/org-scope.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly orgScopeService: OrgScopeService,
    private readonly auditLogService: AuditLogService,
  ) { }

  async create(dto: CreateTaskDto, user: ITokenPayload) {
    // Determine target org: parent org users can assign to child orgs
    let targetOrgId = user.organizationId;
    if (dto.organizationId && user.isParentOrg) {
      const visibleOrgIds = await this.orgScopeService.getVisibleOrgIds(user);
      if (visibleOrgIds.includes(dto.organizationId)) {
        targetOrgId = dto.organizationId;
      }
    }

    const maxPos = await this.taskRepo
      .createQueryBuilder('task')
      .select('MAX(task.position)', 'max')
      .where('task.organizationId = :orgId', { orgId: targetOrgId })
      .getRawOne();

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description || '',
      status: dto.status || TaskStatus.TODO,
      priority: dto.priority,
      categoryId: dto.categoryId,
      dueDate: dto.dueDate || null,
      createdById: user.sub,
      organizationId: targetOrgId,
      position: (maxPos?.max ?? -1) + 1,
    });
    const saved = await this.taskRepo.save(task);

    await this.auditLogService.log(
      AuditAction.CREATE, AuditResource.TASK, saved.id,
      user.sub, user.organizationId,
      { title: saved.title, status: saved.status, priority: saved.priority },
    );

    return this.taskRepo.findOne({
      where: { id: saved.id },
      relations: ['createdBy', 'category', 'organization'],
    });
  }

  async findAll(user: ITokenPayload, query?: {
    status?: TaskStatus;
    priority?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);

    const qb = this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.category', 'category')
      .leftJoinAndSelect('task.organization', 'organization')
      .where('task.organizationId IN (:...orgIds)', { orgIds });

    if (query?.status) {
      qb.andWhere('task.status = :status', { status: query.status });
    }
    if (query?.priority) {
      qb.andWhere('task.priority = :priority', { priority: query.priority });
    }
    if (query?.categoryId) {
      qb.andWhere('task.categoryId = :categoryId', { categoryId: Number(query.categoryId) });
    }

    const sortBy = query?.sortBy || 'position';
    const sortOrder = query?.sortOrder || 'ASC';
    const validSortFields = ['position', 'priority', 'status', 'createdAt', 'updatedAt', 'title'];
    if (validSortFields.includes(sortBy)) {
      qb.orderBy(`task.${sortBy}`, sortOrder);
    } else {
      qb.orderBy('task.position', 'ASC');
    }

    const tasks = await qb.getMany();
    // Sanitize: remove password from createdBy
    return tasks.map((t) => {
      if (t.createdBy) {
        const { password, ...safeUser } = t.createdBy as any;
        t.createdBy = safeUser;
      }
      return t;
    });
  }

  async update(id: number, dto: UpdateTaskDto, user: ITokenPayload) {
    const task = await this.taskRepo.findOne({ where: { id }, relations: ['organization'] });
    if (!task) throw new NotFoundException('Task not found');

    // Check org scope
    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);
    if (!orgIds.includes(task.organizationId)) {
      throw new ForbiddenException('Task not in your organization scope');
    }

    // Check ownership: Admin can only edit own tasks
    if (!hasPermission(user.role, Permission.TASK_EDIT_ANY)) {
      if (task.createdById !== user.sub) {
        throw new ForbiddenException('You can only edit your own tasks');
      }
    }

    // Compute actual changes (only fields that differ)
    const changes: Record<string, string> = {};
    const trackableFields: (keyof UpdateTaskDto)[] = ['title', 'description', 'status', 'priority', 'categoryId', 'dueDate'];
    for (const field of trackableFields) {
      if (dto[field] !== undefined && dto[field] !== (task as any)[field]) {
        changes[field] = `${(task as any)[field]} → ${dto[field]}`;
      }
    }

    Object.assign(task, dto);
    const saved = await this.taskRepo.save(task);

    // Only log if something actually changed
    if (Object.keys(changes).length > 0) {
      await this.auditLogService.log(
        AuditAction.UPDATE, AuditResource.TASK, saved.id,
        user.sub, user.organizationId, { title: saved.title, ...changes },
      );
    }

    return this.taskRepo.findOne({
      where: { id: saved.id },
      relations: ['createdBy', 'category', 'organization'],
    });
  }

  async delete(id: number, user: ITokenPayload) {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);
    if (!orgIds.includes(task.organizationId)) {
      throw new ForbiddenException('Task not in your organization scope');
    }

    if (!hasPermission(user.role, Permission.TASK_DELETE_ANY)) {
      if (task.createdById !== user.sub) {
        throw new ForbiddenException('You can only delete your own tasks');
      }
    }

    await this.taskRepo.remove(task);

    await this.auditLogService.log(
      AuditAction.DELETE, AuditResource.TASK, id,
      user.sub, user.organizationId, { title: task.title },
    );

    return { deleted: true };
  }

  async reorder(items: ReorderTaskDto[], user: ITokenPayload) {
    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);

    for (const item of items) {
      const task = await this.taskRepo.findOne({ where: { id: item.taskId } });
      if (!task || !orgIds.includes(task.organizationId)) continue;

      const oldStatus = task.status;
      task.position = item.newPosition;
      if (item.newStatus) {
        task.status = item.newStatus;
      }
      await this.taskRepo.save(task);

      // Audit log when status changes via drag-and-drop
      if (item.newStatus && item.newStatus !== oldStatus) {
        await this.auditLogService.log(
          AuditAction.UPDATE, AuditResource.TASK, task.id,
          user.sub, user.organizationId,
          { title: task.title, status: `${oldStatus} → ${item.newStatus}` },
        );
      }
    }

    return { reordered: true };
  }
}

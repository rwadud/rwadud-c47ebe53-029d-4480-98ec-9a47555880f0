import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto, TokenPayload, AuditAction, AuditResource } from '@stms/data';
import { OrgScopeService } from '../common/services/org-scope.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly orgScopeService: OrgScopeService,
    private readonly auditLogService: AuditLogService,
  ) { }

  async create(dto: CreateCategoryDto, user: TokenPayload) {
    const category = this.categoryRepo.create({
      name: dto.name,
      organizationId: user.organizationId,
      createdById: user.sub,
    });
    const saved = await this.categoryRepo.save(category);

    await this.auditLogService.log(
      AuditAction.CREATE, AuditResource.CATEGORY, saved.id,
      user.sub, user.organizationId, { name: saved.name },
    );

    return saved;
  }

  async findAll(user: TokenPayload) {
    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);

    // Also include parent org's categories so child org users see shared categories
    if (!user.isParentOrg) {
      const userOrg = await this.orgScopeService.getOrg(user.organizationId);
      if (userOrg?.parentId && !orgIds.includes(userOrg.parentId)) {
        orgIds.push(userOrg.parentId);
      }
    }

    return this.categoryRepo.find({
      where: { organizationId: In(orgIds) },
      relations: ['createdBy'],
      order: { name: 'ASC' },
    });
  }

  async update(id: number, dto: UpdateCategoryDto, user: TokenPayload) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);
    if (!orgIds.includes(category.organizationId)) {
      throw new ForbiddenException('Category not in your organization scope');
    }

    const oldName = category.name;
    category.name = dto.name;
    const saved = await this.categoryRepo.save(category);

    if (oldName !== dto.name) {
      await this.auditLogService.log(
        AuditAction.UPDATE, AuditResource.CATEGORY, saved.id,
        user.sub, user.organizationId,
        { name: `${oldName} \u2192 ${saved.name}` },
      );
    }

    return saved;
  }

  async delete(id: number, user: TokenPayload) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);
    if (!orgIds.includes(category.organizationId)) {
      throw new ForbiddenException('Category not in your organization scope');
    }

    await this.categoryRepo.remove(category);

    await this.auditLogService.log(
      AuditAction.DELETE, AuditResource.CATEGORY, id,
      user.sub, user.organizationId, { name: category.name },
    );

    return { deleted: true };
  }
}

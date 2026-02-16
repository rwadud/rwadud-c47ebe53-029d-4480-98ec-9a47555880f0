import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto, ITokenPayload, AuditAction, AuditResource, Role } from '@stms/data';
import { OrgScopeService } from '../common/services/org-scope.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly orgScopeService: OrgScopeService,
    private readonly auditLogService: AuditLogService,
  ) { }

  async findAll(user: ITokenPayload) {
    const orgIds = await this.orgScopeService.getVisibleOrgIds(user);
    const users = await this.userRepo.find({
      where: { organizationId: In(orgIds) },
      relations: ['organization'],
      order: { name: 'ASC' },
    });
    // Strip passwords
    return users.map(({ password, ...u }) => u);
  }

  async create(dto: CreateUserDto, actor: ITokenPayload) {
    // Verify target org is visible
    const orgIds = await this.orgScopeService.getVisibleOrgIds(actor);
    if (!orgIds.includes(dto.organizationId)) {
      throw new ForbiddenException('Cannot create users in that organization');
    }

    // Owners can only create Admins and Viewers, not other Owners
    if (dto.role === 'owner' as any) {
      throw new ForbiddenException('Cannot create Owner-level users');
    }

    // Check for duplicate email
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role as Role,
      organizationId: dto.organizationId,
    });
    const saved = await this.userRepo.save(user);

    await this.auditLogService.log(
      AuditAction.CREATE, AuditResource.USER, saved.id,
      actor.sub, actor.organizationId,
      { name: saved.name, email: saved.email, role: saved.role },
    );

    const { password, ...result } = saved;
    return result;
  }

  async update(id: number, dto: UpdateUserDto, actor: ITokenPayload) {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['organization'] });
    if (!user) throw new NotFoundException('User not found');

    const orgIds = await this.orgScopeService.getVisibleOrgIds(actor);
    if (!orgIds.includes(user.organizationId)) {
      throw new ForbiddenException('User not in your organization scope');
    }

    // Cannot change a user to Owner
    if (dto.role === 'owner' as any) {
      throw new ForbiddenException('Cannot promote to Owner');
    }

    // If changing org, verify the new org is visible
    if (dto.organizationId && !orgIds.includes(dto.organizationId)) {
      throw new ForbiddenException('Cannot move user to that organization');
    }

    // Compute actual changes before applying
    const changes: Record<string, string> = {};
    if (dto.name && dto.name !== user.name) {
      changes.name = `${user.name} \u2192 ${dto.name}`;
    }
    if (dto.role && dto.role !== user.role) {
      changes.role = `${user.role} \u2192 ${dto.role}`;
    }
    if (dto.organizationId && dto.organizationId !== user.organizationId) {
      changes.organizationId = `${user.organizationId} \u2192 ${dto.organizationId}`;
    }

    if (dto.name) user.name = dto.name;
    if (dto.role) user.role = dto.role as Role;
    if (dto.organizationId) user.organizationId = dto.organizationId;

    const saved = await this.userRepo.save(user);

    if (Object.keys(changes).length > 0) {
      await this.auditLogService.log(
        AuditAction.UPDATE, AuditResource.USER, saved.id,
        actor.sub, actor.organizationId,
        { name: saved.name, ...changes },
      );
    }

    const { password, ...result } = saved;
    return result;
  }

  async delete(id: number, actor: ITokenPayload) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Cannot delete yourself
    if (user.id === actor.sub) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Cannot delete another Owner
    if (user.role === Role.OWNER) {
      throw new ForbiddenException('Cannot delete Owner-level users');
    }

    const orgIds = await this.orgScopeService.getVisibleOrgIds(actor);
    if (!orgIds.includes(user.organizationId)) {
      throw new ForbiddenException('User not in your organization scope');
    }

    await this.userRepo.remove(user);

    await this.auditLogService.log(
      AuditAction.DELETE, AuditResource.USER, id,
      actor.sub, actor.organizationId,
      { name: user.name, email: user.email },
    );

    return { deleted: true };
  }
}

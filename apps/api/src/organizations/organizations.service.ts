import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Category } from '../categories/category.entity';
import { CreateOrgDto, UpdateOrgDto, TokenPayload } from '@stms/data';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) { }

  async findAll(user: TokenPayload) {
    if (user.isParentOrg) {
      return this.orgRepo.find({
        where: [
          { id: user.organizationId },
          { parentId: user.organizationId },
        ],
        relations: ['children'],
        order: { parentId: 'ASC', name: 'ASC' },
      });
    }
    return this.orgRepo.find({
      where: { id: user.organizationId },
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateOrgDto, actor: TokenPayload) {
    if (!actor.isParentOrg) {
      throw new ForbiddenException('Only parent org owners can create organizations');
    }

    // Allow creating child orgs (under actor's org) or new independent parent orgs
    const org = this.orgRepo.create({
      name: dto.name,
      parentId: dto.parentId === null ? null : actor.organizationId,
    });
    return this.orgRepo.save(org);
  }

  async update(id: number, dto: UpdateOrgDto, actor: TokenPayload) {
    if (!actor.isParentOrg) {
      throw new ForbiddenException('Only parent org owners can manage organizations');
    }

    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    // Must be actor's own org or a child
    if (org.id !== actor.organizationId && org.parentId !== actor.organizationId) {
      throw new ForbiddenException('Organization not in your scope');
    }

    org.name = dto.name;
    return this.orgRepo.save(org);
  }

  async delete(id: number, actor: TokenPayload) {
    if (!actor.isParentOrg) {
      throw new ForbiddenException('Only parent org owners can manage organizations');
    }

    const org = await this.orgRepo.findOne({ where: { id }, relations: ['children'] });
    if (!org) throw new NotFoundException('Organization not found');

    // Cannot delete parent org
    if (org.id === actor.organizationId) {
      throw new ForbiddenException('Cannot delete your own organization');
    }

    // Must be a child of actor's org
    if (org.parentId !== actor.organizationId) {
      throw new ForbiddenException('Organization not in your scope');
    }

    // Check for users, tasks, categories
    const userCount = await this.userRepo.count({ where: { organizationId: id } });
    const taskCount = await this.taskRepo.count({ where: { organizationId: id } });
    const catCount = await this.categoryRepo.count({ where: { organizationId: id } });
    if (userCount > 0 || taskCount > 0 || catCount > 0) {
      throw new ConflictException(
        `Cannot delete: organization has ${userCount} user(s), ${taskCount} task(s), and ${catCount} category/categories`,
      );
    }

    await this.orgRepo.remove(org);
    return { deleted: true };
  }
}

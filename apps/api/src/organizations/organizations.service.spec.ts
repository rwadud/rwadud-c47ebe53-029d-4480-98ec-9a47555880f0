import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from './organization.entity';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { Category } from '../categories/category.entity';
import { TokenPayload, Role } from '@stms/data';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgRepo: any;
  let userRepo: any;
  let taskRepo: any;
  let categoryRepo: any;

  const parentOwner: TokenPayload = {
    sub: 1, email: 'owner@hq.com', role: Role.OWNER,
    organizationId: 1, isParentOrg: true,
  };

  const childUser: TokenPayload = {
    sub: 2, email: 'user@branch.com', role: Role.OWNER,
    organizationId: 2, isParentOrg: false,
  };

  beforeEach(async () => {
    orgRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 10 })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      remove: jest.fn(),
    };
    userRepo = { count: jest.fn().mockResolvedValue(0) };
    taskRepo = { count: jest.fn().mockResolvedValue(0) };
    categoryRepo = { count: jest.fn().mockResolvedValue(0) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: getRepositoryToken(Organization), useValue: orgRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  describe('findAll', () => {
    it('should return parent + child orgs for parent org user', async () => {
      orgRepo.find.mockResolvedValue([
        { id: 1, name: 'HQ', parentId: null },
        { id: 2, name: 'Branch', parentId: 1 },
      ]);

      const result = await service.findAll(parentOwner);
      expect(result).toHaveLength(2);
    });

    it('should return only own org for child org user', async () => {
      orgRepo.find.mockResolvedValue([{ id: 2, name: 'Branch', parentId: 1 }]);

      const result = await service.findAll(childUser);
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should allow parent org user to create child org', async () => {
      const result = await service.create(
        { name: 'NewBranch', parentId: undefined },
        parentOwner,
      );

      expect(orgRepo.create).toHaveBeenCalledWith({
        name: 'NewBranch', parentId: 1,
      });
    });

    it('should allow creating independent parent org', async () => {
      await service.create({ name: 'IndyOrg', parentId: null }, parentOwner);

      expect(orgRepo.create).toHaveBeenCalledWith({
        name: 'IndyOrg', parentId: null,
      });
    });

    it('should deny child org user from creating orgs', async () => {
      await expect(
        service.create({ name: 'Nope', parentId: null }, childUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should allow renaming own org', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 1, name: 'HQ', parentId: null });

      const result = await service.update(1, { name: 'Renamed HQ' }, parentOwner);
      expect(orgRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Renamed HQ' }),
      );
    });

    it('should allow renaming child org', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 2, name: 'Branch', parentId: 1 });

      await service.update(2, { name: 'New Branch' }, parentOwner);
      expect(orgRepo.save).toHaveBeenCalled();
    });

    it('should deny renaming unrelated org', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 99, name: 'Other', parentId: 50 });

      await expect(
        service.update(99, { name: 'Nope' }, parentOwner),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny child org user from updating', async () => {
      await expect(
        service.update(2, { name: 'x' }, childUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for unknown org', async () => {
      orgRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'x' }, parentOwner),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete child org that has no users/tasks/categories', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 2, name: 'B', parentId: 1, children: [] });

      const result = await service.delete(2, parentOwner);
      expect(result).toEqual({ deleted: true });
      expect(orgRepo.remove).toHaveBeenCalled();
    });

    it('should deny deleting own org', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 1, name: 'HQ', parentId: null, children: [] });

      await expect(service.delete(1, parentOwner))
        .rejects.toThrow(ForbiddenException);
    });

    it('should deny child org user from deleting', async () => {
      await expect(service.delete(2, childUser))
        .rejects.toThrow(ForbiddenException);
    });

    it('should deny deleting unrelated org', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 99, name: 'X', parentId: 50, children: [] });

      await expect(service.delete(99, parentOwner))
        .rejects.toThrow(ForbiddenException);
    });

    it('should reject if org still has users', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 2, name: 'B', parentId: 1, children: [] });
      userRepo.count.mockResolvedValue(3);

      await expect(service.delete(2, parentOwner))
        .rejects.toThrow(ConflictException);
    });

    it('should reject if org still has tasks', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 2, name: 'B', parentId: 1, children: [] });
      taskRepo.count.mockResolvedValue(5);

      await expect(service.delete(2, parentOwner))
        .rejects.toThrow(ConflictException);
    });

    it('should reject if org still has categories', async () => {
      orgRepo.findOne.mockResolvedValue({ id: 2, name: 'B', parentId: 1, children: [] });
      categoryRepo.count.mockResolvedValue(2);

      await expect(service.delete(2, parentOwner))
        .rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for unknown org', async () => {
      orgRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(999, parentOwner))
        .rejects.toThrow(NotFoundException);
    });
  });
});

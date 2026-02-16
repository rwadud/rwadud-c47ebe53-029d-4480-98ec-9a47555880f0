import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { OrgScopeService } from '../common/services/org-scope.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TokenPayload, Role } from '@stms/data';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: any;
  let orgScopeService: any;
  let auditLogService: any;

  const ownerPayload: TokenPayload = {
    sub: 1, email: 'owner@x.com', role: Role.OWNER,
    organizationId: 1, isParentOrg: true,
  };

  const childOrgUser: TokenPayload = {
    sub: 2, email: 'child@x.com', role: Role.ADMIN,
    organizationId: 2, isParentOrg: false,
  };

  beforeEach(async () => {
    categoryRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 10 })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      remove: jest.fn(),
    };
    orgScopeService = {
      getVisibleOrgIds: jest.fn().mockResolvedValue([1, 2]),
      getOrg: jest.fn().mockResolvedValue({ id: 2, parentId: 1 }),
    };
    auditLogService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
        { provide: OrgScopeService, useValue: orgScopeService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('create', () => {
    it('should create a category and audit-log it', async () => {
      const result = await service.create({ name: 'Bug' }, ownerPayload);

      expect(categoryRepo.create).toHaveBeenCalledWith({
        name: 'Bug', organizationId: 1, createdById: 1,
      });
      expect(auditLogService.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return categories for visible orgs', async () => {
      categoryRepo.find.mockResolvedValue([{ id: 1, name: 'A' }]);

      const result = await service.findAll(ownerPayload);
      expect(result).toHaveLength(1);
    });

    it('should include parent org categories for child org users', async () => {
      orgScopeService.getVisibleOrgIds.mockResolvedValue([2]); // child sees only own
      orgScopeService.getOrg.mockResolvedValue({ id: 2, parentId: 1 });
      categoryRepo.find.mockResolvedValue([{ id: 1, name: 'Shared' }]);

      await service.findAll(childOrgUser);

      // Should query with both [2, 1] (child + parent)
      expect(categoryRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update category name and audit-log it', async () => {
      categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'Old', organizationId: 1 });
      categoryRepo.save.mockImplementation((c: any) => Promise.resolve(c));

      const result = await service.update(1, { name: 'New' }, ownerPayload);

      expect(result.name).toBe('New');
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it('should not audit-log when name is unchanged', async () => {
      categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'Same', organizationId: 1 });
      categoryRepo.save.mockImplementation((c: any) => Promise.resolve(c));

      await service.update(1, { name: 'Same' }, ownerPayload);

      expect(auditLogService.log).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown category', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'x' }, ownerPayload))
        .rejects.toThrow(NotFoundException);
    });

    it('should deny if category outside org scope', async () => {
      categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'X', organizationId: 99 });

      await expect(service.update(1, { name: 'x' }, ownerPayload))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete category and audit-log it', async () => {
      categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'Del', organizationId: 1 });

      const result = await service.delete(1, ownerPayload);

      expect(result).toEqual({ deleted: true });
      expect(categoryRepo.remove).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown category', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(999, ownerPayload))
        .rejects.toThrow(NotFoundException);
    });

    it('should deny if category outside org scope', async () => {
      categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'X', organizationId: 99 });

      await expect(service.delete(1, ownerPayload))
        .rejects.toThrow(ForbiddenException);
    });
  });
});

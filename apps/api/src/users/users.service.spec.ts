import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { OrgScopeService } from '../common/services/org-scope.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TokenPayload, Role } from '@stms/data';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let orgScopeService: any;
  let auditLogService: any;

  const ownerPayload: TokenPayload = {
    sub: 1,
    email: 'owner@example.com',
    role: Role.OWNER,
    organizationId: 1,
    isParentOrg: true,
  };

  const adminPayload: TokenPayload = {
    sub: 2,
    email: 'admin@example.com',
    role: Role.ADMIN,
    organizationId: 1,
    isParentOrg: false,
  };

  beforeEach(async () => {
    userRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 10 })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      remove: jest.fn(),
    };
    orgScopeService = {
      getVisibleOrgIds: jest.fn().mockResolvedValue([1, 2]),
    };
    auditLogService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: OrgScopeService, useValue: orgScopeService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return users within visible orgs (passwords stripped)', async () => {
      userRepo.find.mockResolvedValue([
        { id: 1, name: 'A', email: 'a@x.com', password: 'hashed', organizationId: 1, organization: {} },
        { id: 2, name: 'B', email: 'b@x.com', password: 'hashed', organizationId: 2, organization: {} },
      ]);

      const result = await service.findAll(ownerPayload);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });
  });

  describe('create', () => {
    it('should create a user and audit-log it', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed123');
      userRepo.findOne.mockResolvedValue(null); // no dupe
      userRepo.create.mockReturnValue({
        id: 10, name: 'New', email: 'new@x.com', password: 'hashed123',
        role: Role.ADMIN, organizationId: 1,
      });
      userRepo.save.mockResolvedValue({
        id: 10, name: 'New', email: 'new@x.com', password: 'hashed123',
        role: Role.ADMIN, organizationId: 1,
      });

      const result = await service.create(
        { name: 'New', email: 'new@x.com', password: 'pass', role: 'admin', organizationId: 1 },
        ownerPayload,
      );

      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('New');
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it('should reject creating an owner-role user', async () => {
      await expect(
        service.create(
          { name: 'Bad', email: 'bad@x.com', password: 'pass', role: 'owner' as any, organizationId: 1 },
          ownerPayload,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject if target org is not visible', async () => {
      orgScopeService.getVisibleOrgIds.mockResolvedValue([1]);

      await expect(
        service.create(
          { name: 'X', email: 'x@x.com', password: 'pass', role: 'admin', organizationId: 99 },
          ownerPayload,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject duplicate email', async () => {
      userRepo.findOne.mockResolvedValue({ id: 5 }); // existing user

      await expect(
        service.create(
          { name: 'Dupe', email: 'dupe@x.com', password: 'pass', role: 'admin', organizationId: 1 },
          ownerPayload,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const existingUser = {
      id: 3, name: 'Old', email: 'old@x.com', password: 'hashed',
      role: Role.ADMIN, organizationId: 1, organization: {},
    };

    it('should update user and audit-log changes', async () => {
      userRepo.findOne.mockResolvedValue({ ...existingUser });
      userRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.update(3, { name: 'New Name' }, ownerPayload);

      expect(result.name).toBe('New Name');
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it('should reject promoting user to owner', async () => {
      userRepo.findOne.mockResolvedValue({ ...existingUser });

      await expect(
        service.update(3, { role: 'owner' as any }, ownerPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { name: 'x' }, ownerPayload),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject if user is outside org scope', async () => {
      userRepo.findOne.mockResolvedValue({ ...existingUser, organizationId: 99 });

      await expect(
        service.update(3, { name: 'x' }, ownerPayload),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete user and audit-log it', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 3, name: 'Del', email: 'del@x.com',
        role: Role.ADMIN, organizationId: 1,
      });

      const result = await service.delete(3, ownerPayload);

      expect(result).toEqual({ deleted: true });
      expect(userRepo.remove).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it('should reject self-deletion', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 1, name: 'Me', role: Role.OWNER, organizationId: 1,
      });

      await expect(service.delete(1, ownerPayload))
        .rejects.toThrow(ForbiddenException);
    });

    it('should reject deleting another owner', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 5, name: 'Other Owner', role: Role.OWNER, organizationId: 1,
      });

      await expect(service.delete(5, ownerPayload))
        .rejects.toThrow(ForbiddenException);
    });

    it('should reject if user not in org scope', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 3, role: Role.ADMIN, organizationId: 99,
      });

      await expect(service.delete(3, ownerPayload))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for unknown user', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(999, ownerPayload))
        .rejects.toThrow(NotFoundException);
    });
  });
});

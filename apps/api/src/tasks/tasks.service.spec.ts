import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { OrgScopeService } from '../common/services/org-scope.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TokenPayload, Role, TaskStatus, TaskPriority } from '@stms/data';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: any;
  let orgScopeService: any;
  let auditLogService: any;

  const ownerPayload: TokenPayload = {
    sub: 1, email: 'owner@x.com', role: Role.OWNER,
    organizationId: 1, isParentOrg: true,
  };

  const adminPayload: TokenPayload = {
    sub: 2, email: 'admin@x.com', role: Role.ADMIN,
    organizationId: 1, isParentOrg: false,
  };

  const viewerPayload: TokenPayload = {
    sub: 3, email: 'viewer@x.com', role: Role.VIEWER,
    organizationId: 1, isParentOrg: false,
  };

  beforeEach(async () => {
    const mockQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ max: 5 }),
      getMany: jest.fn().mockResolvedValue([]),
    };

    taskRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 10 })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    };
    orgScopeService = {
      getVisibleOrgIds: jest.fn().mockResolvedValue([1, 2]),
    };
    auditLogService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: OrgScopeService, useValue: orgScopeService },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create a task with correct position and audit it', async () => {
      taskRepo.findOne.mockResolvedValue({ id: 10, title: 'New Task', status: TaskStatus.TODO });

      const result = await service.create(
        { title: 'New Task', priority: TaskPriority.MEDIUM },
        ownerPayload,
      );

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          createdById: 1,
          organizationId: 1,
          position: 6, // max (5) + 1
        }),
      );
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it('should allow parent org user to create task in child org', async () => {
      taskRepo.findOne.mockResolvedValue({ id: 10, title: 'Task' });

      await service.create(
        { title: 'Task', priority: TaskPriority.LOW, organizationId: 2 },
        ownerPayload,
      );

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 2 }),
      );
    });
  });

  describe('findAll', () => {
    it('should query tasks from visible orgs', async () => {
      const mockQb = taskRepo.createQueryBuilder();
      mockQb.getMany.mockResolvedValue([
        { id: 1, title: 'T1', createdBy: { id: 1, name: 'A', password: 'hash' } },
      ]);

      const result = await service.findAll(ownerPayload);

      expect(result).toHaveLength(1);
      expect(result[0].createdBy).not.toHaveProperty('password');
    });
  });

  describe('update', () => {
    const ownedTask = {
      id: 1, title: 'Mine', createdById: 2,
      organizationId: 1, status: TaskStatus.TODO, organization: {},
    };

    it('should allow owner to update any task', async () => {
      taskRepo.findOne
        .mockResolvedValueOnce({ ...ownedTask, createdById: 99 }) // not owned by caller
        .mockResolvedValueOnce({ ...ownedTask, createdById: 99, title: 'Updated' }); // re-fetch

      const result = await service.update(1, { title: 'Updated' }, ownerPayload);
      expect(taskRepo.save).toHaveBeenCalled();
    });

    it('should allow admin to update own task', async () => {
      taskRepo.findOne
        .mockResolvedValueOnce({ ...ownedTask }) // owned by admin (sub=2, createdById=2)
        .mockResolvedValueOnce({ ...ownedTask, title: 'Updated' });

      await expect(
        service.update(1, { title: 'Updated' }, adminPayload),
      ).resolves.toBeDefined();
    });

    it('should deny admin from updating other peoples tasks', async () => {
      taskRepo.findOne.mockResolvedValueOnce({ ...ownedTask, createdById: 99 });

      await expect(
        service.update(1, { title: 'Nope' }, adminPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should deny if task is outside org scope', async () => {
      taskRepo.findOne.mockResolvedValue({ ...ownedTask, organizationId: 99 });

      await expect(
        service.update(1, { title: 'x' }, ownerPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for unknown task', async () => {
      taskRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { title: 'x' }, ownerPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should allow owner to delete any task', async () => {
      taskRepo.findOne.mockResolvedValue({
        id: 1, title: 'T', createdById: 99, organizationId: 1,
      });

      const result = await service.delete(1, ownerPayload);
      expect(result).toEqual({ deleted: true });
      expect(auditLogService.log).toHaveBeenCalled();
    });

    it('should allow admin to delete own task', async () => {
      taskRepo.findOne.mockResolvedValue({
        id: 1, title: 'T', createdById: 2, organizationId: 1,
      });

      const result = await service.delete(1, adminPayload);
      expect(result).toEqual({ deleted: true });
    });

    it('should deny admin from deleting other peoples tasks', async () => {
      taskRepo.findOne.mockResolvedValue({
        id: 1, title: 'T', createdById: 99, organizationId: 1,
      });

      await expect(service.delete(1, adminPayload))
        .rejects.toThrow(ForbiddenException);
    });

    it('should deny if task outside org scope', async () => {
      taskRepo.findOne.mockResolvedValue({
        id: 1, title: 'T', createdById: 1, organizationId: 99,
      });

      await expect(service.delete(1, ownerPayload))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for unknown task', async () => {
      taskRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(999, ownerPayload))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('should reorder tasks within org scope', async () => {
      taskRepo.findOne.mockResolvedValue({
        id: 1, status: TaskStatus.TODO, organizationId: 1, position: 0,
      });

      const result = await service.reorder(
        [{ taskId: 1, newPosition: 3, newStatus: TaskStatus.IN_PROGRESS }],
        ownerPayload,
      );

      expect(result).toEqual({ reordered: true });
      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ position: 3, status: TaskStatus.IN_PROGRESS }),
      );
      expect(auditLogService.log).toHaveBeenCalled(); // status changed
    });

    it('should skip tasks outside org scope', async () => {
      taskRepo.findOne.mockResolvedValue({
        id: 5, status: TaskStatus.TODO, organizationId: 99, position: 0,
      });

      await service.reorder(
        [{ taskId: 5, newPosition: 0 }],
        ownerPayload,
      );

      expect(taskRepo.save).not.toHaveBeenCalled();
    });
  });
});

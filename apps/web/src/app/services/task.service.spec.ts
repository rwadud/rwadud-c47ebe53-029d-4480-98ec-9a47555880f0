import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { TaskStatus, TaskPriority } from '@stms/data';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TaskService,
      ],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getTasks', () => {
    it('should GET /api/tasks with no params', () => {
      service.getTasks().subscribe((tasks) => {
        expect(tasks).toEqual([]);
      });

      const req = httpMock.expectOne('/api/tasks');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should pass filters as query params', () => {
      service.getTasks({ status: TaskStatus.IN_PROGRESS, priority: 'high' }).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/tasks' &&
          r.params.get('status') === TaskStatus.IN_PROGRESS &&
          r.params.get('priority') === 'high',
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should skip falsy filter values', () => {
      service.getTasks({ status: undefined, priority: '' }).subscribe();

      const req = httpMock.expectOne('/api/tasks');
      expect(req.request.params.keys()).toEqual([]);
      req.flush([]);
    });
  });

  describe('createTask', () => {
    it('should POST to /api/tasks', () => {
      const dto = { title: 'New Task', priority: TaskPriority.HIGH };
      service.createTask(dto).subscribe((task) => {
        expect(task.id).toBe(1);
      });

      const req = httpMock.expectOne('/api/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ id: 1, ...dto });
    });
  });

  describe('updateTask', () => {
    it('should PUT to /api/tasks/:id', () => {
      service.updateTask(5, { title: 'Updated' }).subscribe((task) => {
        expect(task.title).toBe('Updated');
      });

      const req = httpMock.expectOne('/api/tasks/5');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ title: 'Updated' });
      req.flush({ id: 5, title: 'Updated' });
    });
  });

  describe('deleteTask', () => {
    it('should DELETE /api/tasks/:id', () => {
      service.deleteTask(3).subscribe((res) => {
        expect(res.deleted).toBe(true);
      });

      const req = httpMock.expectOne('/api/tasks/3');
      expect(req.request.method).toBe('DELETE');
      req.flush({ deleted: true });
    });
  });

  describe('reorderTasks', () => {
    it('should PATCH /api/tasks/reorder', () => {
      const items = [
        { taskId: 1, newPosition: 0, newStatus: TaskStatus.IN_PROGRESS },
        { taskId: 2, newPosition: 1 },
      ];
      service.reorderTasks(items).subscribe((res) => {
        expect(res.reordered).toBe(true);
      });

      const req = httpMock.expectOne('/api/tasks/reorder');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(items);
      req.flush({ reordered: true });
    });
  });
});

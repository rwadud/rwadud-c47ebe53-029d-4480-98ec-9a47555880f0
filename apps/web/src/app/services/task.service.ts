import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Task, CreateTaskDto, UpdateTaskDto, ReorderTaskDto, TaskStatus } from '@stms/data';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly apiUrl = '/api/tasks';

  constructor(private http: HttpClient) { }

  getTasks(filters?: {
    status?: TaskStatus;
    priority?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params = params.set(key, value);
      });
    }
    return this.http.get<Task[]>(this.apiUrl, { params });
  }

  createTask(dto: CreateTaskDto) {
    return this.http.post<Task>(this.apiUrl, dto);
  }

  updateTask(id: number, dto: UpdateTaskDto) {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, dto);
  }

  deleteTask(id: number) {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/${id}`);
  }

  reorderTasks(items: ReorderTaskDto[]) {
    return this.http.patch<{ reordered: boolean }>(`${this.apiUrl}/reorder`, items);
  }
}

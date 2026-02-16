import { TaskStatus } from '../enums/task-status.enum';

export interface ReorderTaskDto {
  taskId: number;
  newPosition: number;
  newStatus?: TaskStatus;
}

import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { User } from './user.interface';
import { Category } from './category.interface';
import { Organization } from './organization.interface';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  categoryId: number | null;
  createdById: number;
  organizationId: number;
  position: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  category?: Category;
  organization?: Organization;
}

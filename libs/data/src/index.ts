// Enums (value exports)
export { TaskStatus } from './lib/enums/task-status.enum';
export { TaskPriority } from './lib/enums/task-priority.enum';
export { Role } from './lib/enums/user-role.enum';
export { AuditAction } from './lib/enums/audit-action.enum';
export { AuditResource } from './lib/enums/audit-resource.enum';

// Interfaces (type-only exports for isolatedModules compatibility)
export type { Organization } from './lib/interfaces/organization.interface';
export type { User } from './lib/interfaces/user.interface';
export type { Task } from './lib/interfaces/task.interface';
export type { Category } from './lib/interfaces/category.interface';
export type { AuditLog, LoginRequest, LoginResponse, TokenPayload } from './lib/interfaces/audit-log.interface';

// DTOs (type-only exports for isolatedModules compatibility)
export type { CreateTaskDto } from './lib/dto/create-task.dto';
export type { UpdateTaskDto } from './lib/dto/update-task.dto';
export type { ReorderTaskDto } from './lib/dto/reorder-task.dto';
export type { CreateCategoryDto } from './lib/dto/create-category.dto';
export type { UpdateCategoryDto } from './lib/dto/update-category.dto';
export type { LoginDto } from './lib/dto/login.dto';
export type { CreateUserDto } from './lib/dto/create-user.dto';
export type { UpdateUserDto } from './lib/dto/update-user.dto';
export type { CreateOrgDto } from './lib/dto/create-org.dto';
export type { UpdateOrgDto } from './lib/dto/update-org.dto';

// Permissions (value exports)
export { Permission, PERMISSION_MATRIX, hasPermission } from './lib/permissions/permission-matrix';

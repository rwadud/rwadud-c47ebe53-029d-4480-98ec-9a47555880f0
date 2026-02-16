import { AuditAction } from '../enums/audit-action.enum';
import { AuditResource } from '../enums/audit-resource.enum';
import { Role } from '../enums/user-role.enum';
import { User } from './user.interface';

export interface AuditLog {
  id: number;
  action: AuditAction;
  resource: AuditResource;
  resourceId: number;
  userId: number;
  organizationId: number;
  timestamp: string;
  details: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: Omit<User, 'organization'> & { organization: { id: number; name: string; parentId: number | null } };
}

export interface TokenPayload {
  sub: number;
  email: string;
  role: Role;
  organizationId: number;
  isParentOrg: boolean;
}

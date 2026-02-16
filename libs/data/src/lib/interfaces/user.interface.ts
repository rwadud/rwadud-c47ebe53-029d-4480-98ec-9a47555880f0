import { Role } from '../enums/user-role.enum';
import { Organization } from './organization.interface';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  organizationId: number;
  organization?: Organization;
}

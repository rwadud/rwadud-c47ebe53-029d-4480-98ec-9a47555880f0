import { Role } from '../enums/user-role.enum';

export interface Organization {
  id: number;
  name: string;
  parentId: number | null;
}

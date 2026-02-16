import { Organization } from './organization.interface';

export interface Category {
  id: number;
  name: string;
  organizationId: number;
  createdById: number;
}

export interface UpdateUserDto {
  name?: string;
  role?: 'admin' | 'viewer';
  organizationId?: number;
}

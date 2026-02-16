export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'viewer';
  organizationId: number;
}

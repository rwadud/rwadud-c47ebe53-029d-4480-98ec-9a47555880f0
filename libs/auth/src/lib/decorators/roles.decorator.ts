import { SetMetadata } from '@nestjs/common';
import { Permission } from '@stms/data';

export const PERMISSIONS_KEY = 'permissions';
export const Roles = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Backward compatibility alias
export const RequirePermissions = Roles;

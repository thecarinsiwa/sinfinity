import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from './permissions.constants';

/**
 * Declares required permission codes (e.g. `settings.read`).
 * Enforced by PermissionsGuard once auth populates `user.permissions`.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.constants';
import type { AuthenticatedRequest } from '../types/auth-user.type';

/**
 * Stub-aware permissions guard.
 * - No `@RequirePermissions` → allow
 * - `user.permissions` absent (pre-auth) → allow
 * - `user.permissions` present → require every listed code
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const granted = request.user?.permissions;

    if (granted === undefined) {
      return true;
    }

    const missing = required.filter((code) => !granted.includes(code));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Missing permissions: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}

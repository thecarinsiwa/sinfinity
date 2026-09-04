import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, AuthUser } from '../types/auth-user.type';

/**
 * Resolves the authenticated user from `request.user`.
 * Returns `undefined` until JwtAuthGuard populates the request (phase 1).
 *
 * @example
 * handler(@CurrentUser() user: AuthUser) {}
 * handler(@CurrentUser('id') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (
    property: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | AuthUser[keyof AuthUser] | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return property ? user[property] : user;
  },
);

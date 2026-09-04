import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/auth-user.type';

/**
 * Resolves `organizationId` from `request.user`.
 * Returns `undefined` until JwtAuthGuard populates the request (phase 1).
 *
 * @example
 * handler(@OrganizationId() organizationId: string) {}
 */
export const OrganizationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user?.organizationId;
  },
);

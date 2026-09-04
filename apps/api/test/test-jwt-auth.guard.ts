import type { CanActivate, ExecutionContext } from '@nestjs/common';

/** E2e stub: injects a privileged user without verifying JWT. */
export class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: Record<string, unknown>;
    }>();
    request.user = {
      id: '0191e6b8-4c3a-7b2d-9f1e-testuser0001',
      organizationId: '0191e6b8-4c3a-7b2d-9f1e-testorg00001',
      email: 'test@sinfinity.cd',
      permissions: [
        'settings.read',
        'settings.write',
        'organizations.read',
        'organizations.write',
        'branches.read',
        'branches.write',
        'users.read',
        'users.write',
        'roles.read',
        'roles.write',
        'audit.read',
        'system_settings.read',
        'system_settings.write',
        'documents.read',
        'documents.write',
        'contracts.read',
        'contracts.write',
      ],
      isSuperAdmin: true,
      sessionId: '0191e6b8-4c3a-7b2d-9f1e-session0001',
    };
    return true;
  }
}

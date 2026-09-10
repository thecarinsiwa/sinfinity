import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuditLogsController } from './audit/audit-logs.controller';
import { AuditService } from './audit/audit.service';
import { LoginLogsController } from './login-logs/login-logs.controller';
import { LoginLogsService } from './login-logs/login-logs.service';
import { MeController } from './rbac/me.controller';
import { RbacSeedService } from './rbac/rbac-seed.service';
import { RolesController } from './rbac/roles.controller';
import { RolesService } from './rbac/roles.service';
import { UserRolesController } from './rbac/user-roles.controller';
import { UserRolesService } from './rbac/user-roles.service';

@Module({
  controllers: [
    RolesController,
    UserRolesController,
    MeController,
    AuditLogsController,
    LoginLogsController,
  ],
  providers: [
    RolesService,
    UserRolesService,
    RbacSeedService,
    AuditService,
    LoginLogsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [
    RolesService,
    UserRolesService,
    RbacSeedService,
    AuditService,
    LoginLogsService,
  ],
})
export class SecurityModule {}

import { Module } from '@nestjs/common';
import { MeController } from './rbac/me.controller';
import { RbacSeedService } from './rbac/rbac-seed.service';
import { RolesController } from './rbac/roles.controller';
import { RolesService } from './rbac/roles.service';
import { UserRolesController } from './rbac/user-roles.controller';
import { UserRolesService } from './rbac/user-roles.service';

@Module({
  controllers: [RolesController, UserRolesController, MeController],
  providers: [RolesService, UserRolesService, RbacSeedService],
  exports: [RolesService, UserRolesService, RbacSeedService],
})
export class SecurityModule {}

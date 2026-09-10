import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { SettingsModule } from '../settings/settings.module';
import { BranchesController } from './branches/branches.controller';
import { BranchesService } from './branches/branches.service';
import { OrganizationsController } from './organizations/organizations.controller';
import { OrganizationsService } from './organizations/organizations.service';
import { DevSeedService } from './seeds/dev-seed.service';
import { SystemSettingsController } from './system-settings/system-settings.controller';
import { SystemSettingsService } from './system-settings/system-settings.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [SettingsModule, SecurityModule],
  controllers: [
    OrganizationsController,
    BranchesController,
    UsersController,
    SystemSettingsController,
  ],
  providers: [
    OrganizationsService,
    BranchesService,
    UsersService,
    SystemSettingsService,
    DevSeedService,
  ],
  exports: [
    OrganizationsService,
    BranchesService,
    UsersService,
    SystemSettingsService,
    DevSeedService,
  ],
})
export class OrganisationModule {}

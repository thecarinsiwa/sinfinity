import { Module } from '@nestjs/common';
import { BranchesController } from './branches/branches.controller';
import { BranchesService } from './branches/branches.service';
import { OrganizationsController } from './organizations/organizations.controller';
import { OrganizationsService } from './organizations/organizations.service';
import { SystemSettingsController } from './system-settings/system-settings.controller';
import { SystemSettingsService } from './system-settings/system-settings.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
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
  ],
  exports: [
    OrganizationsService,
    BranchesService,
    UsersService,
    SystemSettingsService,
  ],
})
export class OrganisationModule {}

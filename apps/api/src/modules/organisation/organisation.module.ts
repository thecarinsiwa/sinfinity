import { Module } from '@nestjs/common';
import { BranchesController } from './branches/branches.controller';
import { BranchesService } from './branches/branches.service';
import { OrganizationsController } from './organizations/organizations.controller';
import { OrganizationsService } from './organizations/organizations.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  controllers: [
    OrganizationsController,
    BranchesController,
    UsersController,
  ],
  providers: [OrganizationsService, BranchesService, UsersService],
  exports: [OrganizationsService, BranchesService, UsersService],
})
export class OrganisationModule {}

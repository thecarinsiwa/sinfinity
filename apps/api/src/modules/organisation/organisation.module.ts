import { Module } from '@nestjs/common';
import { BranchesController } from './branches/branches.controller';
import { BranchesService } from './branches/branches.service';
import { OrganizationsController } from './organizations/organizations.controller';
import { OrganizationsService } from './organizations/organizations.service';

@Module({
  controllers: [OrganizationsController, BranchesController],
  providers: [OrganizationsService, BranchesService],
  exports: [OrganizationsService, BranchesService],
})
export class OrganisationModule {}

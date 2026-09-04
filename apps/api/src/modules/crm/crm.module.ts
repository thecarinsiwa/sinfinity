import { Module } from '@nestjs/common';
import { ActivityTypesController } from './activity-types/activity-types.controller';
import { ActivityTypesSeedService } from './activity-types/activity-types-seed.service';
import { ActivityTypesService } from './activity-types/activity-types.service';
import { CustomerCategoriesController } from './customer-categories/customer-categories.controller';
import { CustomerCategoriesService } from './customer-categories/customer-categories.service';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { LeadSourcesController } from './lead-sources/lead-sources.controller';
import { LeadSourcesService } from './lead-sources/lead-sources.service';
import { LeadsController } from './leads/leads.controller';
import { LeadsService } from './leads/leads.service';
import { OpportunitiesController } from './opportunities/opportunities.controller';
import { OpportunitiesService } from './opportunities/opportunities.service';
import { SalesActivitiesController } from './sales-activities/sales-activities.controller';
import { SalesActivitiesService } from './sales-activities/sales-activities.service';

@Module({
  controllers: [
    CustomerCategoriesController,
    CustomersController,
    LeadSourcesController,
    LeadsController,
    OpportunitiesController,
    ActivityTypesController,
    SalesActivitiesController,
  ],
  providers: [
    CustomerCategoriesService,
    CustomersService,
    LeadSourcesService,
    LeadsService,
    OpportunitiesService,
    ActivityTypesService,
    ActivityTypesSeedService,
    SalesActivitiesService,
  ],
  exports: [
    CustomerCategoriesService,
    CustomersService,
    LeadSourcesService,
    LeadsService,
    OpportunitiesService,
    ActivityTypesService,
    ActivityTypesSeedService,
    SalesActivitiesService,
  ],
})
export class CrmModule {}

import { Module } from '@nestjs/common';
import { CustomerCategoriesController } from './customer-categories/customer-categories.controller';
import { CustomerCategoriesService } from './customer-categories/customer-categories.service';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';
import { LeadSourcesController } from './lead-sources/lead-sources.controller';
import { LeadSourcesService } from './lead-sources/lead-sources.service';
import { LeadsController } from './leads/leads.controller';
import { LeadsService } from './leads/leads.service';

@Module({
  controllers: [
    CustomerCategoriesController,
    CustomersController,
    LeadSourcesController,
    LeadsController,
  ],
  providers: [
    CustomerCategoriesService,
    CustomersService,
    LeadSourcesService,
    LeadsService,
  ],
  exports: [
    CustomerCategoriesService,
    CustomersService,
    LeadSourcesService,
    LeadsService,
  ],
})
export class CrmModule {}

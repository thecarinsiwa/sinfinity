import { Module } from '@nestjs/common';
import { CustomerCategoriesController } from './customer-categories/customer-categories.controller';
import { CustomerCategoriesService } from './customer-categories/customer-categories.service';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';

@Module({
  controllers: [CustomerCategoriesController, CustomersController],
  providers: [CustomerCategoriesService, CustomersService],
  exports: [CustomerCategoriesService, CustomersService],
})
export class CrmModule {}

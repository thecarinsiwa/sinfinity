import { Module } from '@nestjs/common';
import { SupplierCategoriesController } from './supplier-categories/supplier-categories.controller';
import { SupplierCategoriesService } from './supplier-categories/supplier-categories.service';
import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';

@Module({
  controllers: [SupplierCategoriesController, SuppliersController],
  providers: [SupplierCategoriesService, SuppliersService],
  exports: [SupplierCategoriesService, SuppliersService],
})
export class SuppliersModule {}

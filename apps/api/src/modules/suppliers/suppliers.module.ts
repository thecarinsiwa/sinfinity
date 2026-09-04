import { Module } from '@nestjs/common';
import { SupplierCategoriesController } from './supplier-categories/supplier-categories.controller';
import { SupplierCategoriesService } from './supplier-categories/supplier-categories.service';
import { SupplierProductsController } from './supplier-products/supplier-products.controller';
import { SupplierProductsService } from './supplier-products/supplier-products.service';
import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';

@Module({
  controllers: [
    SupplierCategoriesController,
    SuppliersController,
    SupplierProductsController,
  ],
  providers: [
    SupplierCategoriesService,
    SuppliersService,
    SupplierProductsService,
  ],
  exports: [
    SupplierCategoriesService,
    SuppliersService,
    SupplierProductsService,
  ],
})
export class SuppliersModule {}

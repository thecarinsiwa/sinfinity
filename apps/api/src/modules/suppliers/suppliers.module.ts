import { Module } from '@nestjs/common';
import { SupplierCategoriesController } from './supplier-categories/supplier-categories.controller';
import { SupplierCategoriesService } from './supplier-categories/supplier-categories.service';
import { SupplierDocumentsController } from './supplier-documents/supplier-documents.controller';
import { SupplierDocumentsService } from './supplier-documents/supplier-documents.service';
import { SupplierEvaluationsController } from './supplier-evaluations/supplier-evaluations.controller';
import { SupplierEvaluationsService } from './supplier-evaluations/supplier-evaluations.service';
import { SupplierHistoriesController } from './supplier-histories/supplier-histories.controller';
import { SupplierHistoriesService } from './supplier-histories/supplier-histories.service';
import { SupplierProductsController } from './supplier-products/supplier-products.controller';
import { SupplierProductsService } from './supplier-products/supplier-products.service';
import { SuppliersController } from './suppliers/suppliers.controller';
import { SuppliersService } from './suppliers/suppliers.service';

@Module({
  controllers: [
    SupplierCategoriesController,
    SuppliersController,
    SupplierDocumentsController,
    SupplierProductsController,
    SupplierEvaluationsController,
    SupplierHistoriesController,
  ],
  providers: [
    SupplierCategoriesService,
    SuppliersService,
    SupplierDocumentsService,
    SupplierProductsService,
    SupplierEvaluationsService,
    SupplierHistoriesService,
  ],
  exports: [
    SupplierCategoriesService,
    SuppliersService,
    SupplierDocumentsService,
    SupplierProductsService,
    SupplierEvaluationsService,
    SupplierHistoriesService,
  ],
})
export class SuppliersModule {}

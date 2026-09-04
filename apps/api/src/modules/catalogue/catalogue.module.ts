import { Module } from '@nestjs/common';
import { ProductBrandsController } from './brands/product-brands.controller';
import { ProductBrandsService } from './brands/product-brands.service';
import { ProductCategoriesController } from './categories/product-categories.controller';
import { ProductCategoriesService } from './categories/product-categories.service';
import { ProductModelsController } from './models/product-models.controller';
import { ProductModelsService } from './models/product-models.service';
import { ProductServicesController } from './product-services/product-services.controller';
import { ProductServicesService } from './product-services/product-services.service';
import { ProductUnitsController } from './product-units/product-units.controller';
import { ProductUnitsService } from './product-units/product-units.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { ServiceCategoriesController } from './service-categories/service-categories.controller';
import { ServiceCategoriesService } from './service-categories/service-categories.service';
import { ServicesController } from './services/services.controller';
import { ServicesService } from './services/services.service';
import { ProductSubcategoriesController } from './subcategories/product-subcategories.controller';
import { ProductSubcategoriesService } from './subcategories/product-subcategories.service';

@Module({
  controllers: [
    ProductCategoriesController,
    ProductSubcategoriesController,
    ProductBrandsController,
    ProductModelsController,
    ProductUnitsController,
    ProductsController,
    ProductServicesController,
    ServiceCategoriesController,
    ServicesController,
  ],
  providers: [
    ProductCategoriesService,
    ProductSubcategoriesService,
    ProductBrandsService,
    ProductModelsService,
    ProductUnitsService,
    ProductsService,
    ProductServicesService,
    ServiceCategoriesService,
    ServicesService,
  ],
  exports: [
    ProductCategoriesService,
    ProductSubcategoriesService,
    ProductBrandsService,
    ProductModelsService,
    ProductUnitsService,
    ProductsService,
    ProductServicesService,
    ServiceCategoriesService,
    ServicesService,
  ],
})
export class CatalogueModule {}

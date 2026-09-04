import { Module } from '@nestjs/common';
import { ProductBrandsController } from './brands/product-brands.controller';
import { ProductBrandsService } from './brands/product-brands.service';
import { ProductCategoriesController } from './categories/product-categories.controller';
import { ProductCategoriesService } from './categories/product-categories.service';
import { ProductModelsController } from './models/product-models.controller';
import { ProductModelsService } from './models/product-models.service';
import { ProductUnitsController } from './product-units/product-units.controller';
import { ProductUnitsService } from './product-units/product-units.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
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
  ],
  providers: [
    ProductCategoriesService,
    ProductSubcategoriesService,
    ProductBrandsService,
    ProductModelsService,
    ProductUnitsService,
    ProductsService,
  ],
  exports: [
    ProductCategoriesService,
    ProductSubcategoriesService,
    ProductBrandsService,
    ProductModelsService,
    ProductUnitsService,
    ProductsService,
  ],
})
export class CatalogueModule {}

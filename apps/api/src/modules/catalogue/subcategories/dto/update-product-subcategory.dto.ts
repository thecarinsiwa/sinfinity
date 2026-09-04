import { PartialType } from '@nestjs/swagger';
import { CreateProductSubcategoryDto } from './create-product-subcategory.dto';

export class UpdateProductSubcategoryDto extends PartialType(
  CreateProductSubcategoryDto,
) {}

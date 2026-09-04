import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSupplierProductDto } from './create-supplier-product.dto';

export class UpdateSupplierProductDto extends PartialType(
  OmitType(CreateSupplierProductDto, ['supplierId', 'productId'] as const),
) {}

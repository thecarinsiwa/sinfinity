import { toBool } from '../../settings/utils/mysql-datetime';
import type {
  ProductImageResponseDto,
  ProductSpecificationResponseDto,
} from './dto/product-nested.dto';
import type { ProductResponseDto } from './dto/product-response.dto';

export type ProductRow = {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  brand_id: string | null;
  model_id: string | null;
  unit_id: string | null;
  base_price: string;
  currency_id: string | null;
  cost_price: string | null;
  is_serialized: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ProductSpecificationRow = {
  id: string;
  product_id: string;
  spec_key: string;
  spec_value: string;
  unit: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  is_primary: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function toProductSpecificationResponse(
  row: ProductSpecificationRow,
): ProductSpecificationResponseDto {
  return {
    id: row.id,
    productId: row.product_id,
    specKey: row.spec_key,
    specValue: row.spec_value,
    unit: row.unit,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toProductImageResponse(
  row: ProductImageRow,
): ProductImageResponseDto {
  return {
    id: row.id,
    productId: row.product_id,
    url: row.url,
    altText: row.alt_text,
    isPrimary: toBool(row.is_primary),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toProductResponse(
  row: ProductRow,
  nested?: {
    specifications?: ProductSpecificationRow[];
    images?: ProductImageRow[];
  },
): ProductResponseDto {
  const base: ProductResponseDto = {
    id: row.id,
    organizationId: row.organization_id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    subcategoryId: row.subcategory_id,
    brandId: row.brand_id,
    modelId: row.model_id,
    unitId: row.unit_id,
    basePrice: row.base_price,
    costPrice: row.cost_price,
    currencyId: row.currency_id,
    isSerialized: toBool(row.is_serialized),
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (nested?.specifications) {
    base.specifications = nested.specifications.map(
      toProductSpecificationResponse,
    );
  }
  if (nested?.images) {
    base.images = nested.images.map(toProductImageResponse);
  }
  return base;
}

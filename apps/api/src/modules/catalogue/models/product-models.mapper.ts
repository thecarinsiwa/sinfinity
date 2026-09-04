import type { ProductModelResponseDto } from './dto/product-model-response.dto';

export type ProductModelRow = {
  id: string;
  brand_id: string;
  name: string;
  manufacturer_sku: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toProductModelResponse(
  row: ProductModelRow,
): ProductModelResponseDto {
  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    manufacturerSku: row.manufacturer_sku,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

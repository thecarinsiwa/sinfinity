import type { ProductSubcategoryResponseDto } from './dto/product-subcategory-response.dto';

export type ProductSubcategoryRow = {
  id: string;
  category_id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toProductSubcategoryResponse(
  row: ProductSubcategoryRow,
): ProductSubcategoryResponseDto {
  return {
    id: row.id,
    categoryId: row.category_id,
    code: row.code,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

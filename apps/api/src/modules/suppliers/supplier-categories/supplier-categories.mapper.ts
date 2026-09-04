import type { SupplierCategoryResponseDto } from './dto/supplier-category-response.dto';

export type SupplierCategoryRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toSupplierCategoryResponse(
  row: SupplierCategoryRow,
): SupplierCategoryResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

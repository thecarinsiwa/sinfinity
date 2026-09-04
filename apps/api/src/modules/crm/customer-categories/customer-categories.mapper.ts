import type { CustomerCategoryResponseDto } from './dto/customer-category-response.dto';

export type CustomerCategoryRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toCustomerCategoryResponse(
  row: CustomerCategoryRow,
): CustomerCategoryResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

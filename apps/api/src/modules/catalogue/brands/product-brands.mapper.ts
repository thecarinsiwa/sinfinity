import type { ProductBrandResponseDto } from './dto/product-brand-response.dto';

export type ProductBrandRow = {
  id: string;
  organization_id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toProductBrandResponse(
  row: ProductBrandRow,
): ProductBrandResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    logoUrl: row.logo_url,
    website: row.website,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

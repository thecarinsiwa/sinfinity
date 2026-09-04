import { ShippingTermResponseDto } from './dto/shipping-term-response.dto';

export type ShippingTermRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  incoterm_version: string | null;
  created_at: string;
  updated_at: string;
};

export function toShippingTermResponse(
  row: ShippingTermRow,
): ShippingTermResponseDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    incotermVersion: row.incoterm_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

import type { ShippingMethodResponseDto } from './dto/shipping-method.dto';

export type ShippingMethodRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export function toShippingMethodResponse(
  row: ShippingMethodRow,
): ShippingMethodResponseDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

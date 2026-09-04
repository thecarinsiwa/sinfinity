import type { ProductUnitResponseDto } from './dto/product-unit-response.dto';

export type ProductUnitRow = {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  unit_id: string | null;
  created_at: string;
  updated_at: string;
};

export function toProductUnitResponse(
  row: ProductUnitRow,
): ProductUnitResponseDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    unitId: row.unit_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

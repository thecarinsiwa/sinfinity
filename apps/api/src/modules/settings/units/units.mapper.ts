import type { UnitType } from './dto/create-unit.dto';
import { UnitResponseDto } from './dto/unit-response.dto';

export type UnitRow = {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  unit_type: UnitType;
  created_at: string;
  updated_at: string;
};

export function toUnitResponse(row: UnitRow): UnitResponseDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    unitType: row.unit_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

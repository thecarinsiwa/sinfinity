import { toBool } from '../utils/mysql-datetime';
import { CurrencyResponseDto } from './dto/currency-response.dto';

export type CurrencyRow = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export function toCurrencyResponse(row: CurrencyRow): CurrencyResponseDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    decimalPlaces: row.decimal_places,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

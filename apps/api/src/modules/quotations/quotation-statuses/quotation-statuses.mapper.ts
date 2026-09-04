import type { QuotationStatusResponseDto } from './dto/quotation-status-response.dto';
import { toBool } from '../../settings/utils/mysql-datetime';

export type QuotationStatusRow = {
  id: string;
  code: string;
  name: string;
  is_final: number | boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function toQuotationStatusResponse(
  row: QuotationStatusRow,
): QuotationStatusResponseDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    isFinal: toBool(row.is_final),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

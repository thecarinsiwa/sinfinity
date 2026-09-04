import type { ProcurementComparisonResponseDto } from './dto/procurement-comparison.dto';

export type ProcurementComparisonRow = {
  id: string;
  procurement_request_id: string;
  compared_by: string | null;
  compared_at: string;
  criteria: unknown;
  scores: unknown;
  selected_quote_id: string | null;
  recommendation: string | null;
  created_at: string;
  updated_at: string;
};

function asJsonObject(
  value: unknown,
): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function toProcurementComparisonResponse(
  row: ProcurementComparisonRow,
): ProcurementComparisonResponseDto {
  return {
    id: row.id,
    procurementRequestId: row.procurement_request_id,
    comparedBy: row.compared_by,
    comparedAt: row.compared_at,
    criteria: asJsonObject(row.criteria),
    scores: asJsonObject(row.scores),
    selectedQuoteId: row.selected_quote_id,
    recommendation: row.recommendation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

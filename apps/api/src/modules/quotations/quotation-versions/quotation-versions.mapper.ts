import type {
  QuotationVersionResponseDto,
  QuotationVersionSummaryDto,
} from './dto/quotation-version.dto';

export type QuotationVersionRow = {
  id: string;
  quotation_id: string;
  version_number: number;
  snapshot: unknown;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
};

export function toQuotationVersionSummary(
  row: QuotationVersionRow,
): QuotationVersionSummaryDto {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    versionNumber: row.version_number,
    changedBy: row.changed_by,
    changeReason: row.change_reason,
    createdAt: row.created_at,
  };
}

export function toQuotationVersionResponse(
  row: QuotationVersionRow,
): QuotationVersionResponseDto {
  return {
    ...toQuotationVersionSummary(row),
    snapshot:
      row.snapshot && typeof row.snapshot === 'object'
        ? (row.snapshot as Record<string, unknown>)
        : { value: row.snapshot },
  };
}

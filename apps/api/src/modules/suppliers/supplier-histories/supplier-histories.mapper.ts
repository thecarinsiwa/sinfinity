import type { SupplierHistoryResponseDto } from './dto/supplier-history.dto';

export type SupplierHistoryRow = {
  id: string;
  supplier_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  amount: string | null;
  currency_id: string | null;
  occurred_at: string;
};

export function toSupplierHistoryResponse(
  row: SupplierHistoryRow,
): SupplierHistoryResponseDto {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    eventType: row.event_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    amount: row.amount,
    currencyId: row.currency_id,
    occurredAt: row.occurred_at,
  };
}

export function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '');
}

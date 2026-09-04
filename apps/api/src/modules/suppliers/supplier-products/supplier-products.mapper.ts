import { toBool } from '../../settings/utils/mysql-datetime';
import type { SupplierProductResponseDto } from './dto/supplier-product-response.dto';

export type SupplierProductRow = {
  id: string;
  supplier_id: string;
  product_id: string;
  supplier_sku: string | null;
  unit_price: string;
  currency_id: string | null;
  moq: string | null;
  lead_time_days: number | null;
  is_available: number;
  created_at: string;
  updated_at: string;
};

export function toSupplierProductResponse(
  row: SupplierProductRow,
): SupplierProductResponseDto {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    productId: row.product_id,
    supplierSku: row.supplier_sku,
    unitPrice: row.unit_price,
    currencyId: row.currency_id,
    moq: row.moq,
    leadTimeDays: row.lead_time_days,
    isAvailable: toBool(row.is_available),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

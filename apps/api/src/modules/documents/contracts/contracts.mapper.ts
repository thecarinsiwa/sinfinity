import type { ContractItemResponseDto } from './dto/contract-item.dto';
import type { ContractStatus } from './dto/contract-item.dto';
import type { ContractResponseDto } from './dto/contract-response.dto';

export type ContractRow = {
  id: string;
  organization_id: string;
  contract_number: string;
  customer_id: string | null;
  supplier_id: string | null;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: ContractStatus;
  document_id: string | null;
  total_value: string | null;
  currency_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ContractItemRow = {
  id: string;
  contract_id: string;
  product_id: string | null;
  service_id: string | null;
  description: string | null;
  quantity: string | null;
  unit_price: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function toContractItemResponse(
  row: ContractItemRow,
): ContractItemResponseDto {
  return {
    id: row.id,
    contractId: row.contract_id,
    productId: row.product_id,
    serviceId: row.service_id,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toContractResponse(
  row: ContractRow,
  items?: ContractItemRow[],
): ContractResponseDto {
  const base: ContractResponseDto = {
    id: row.id,
    organizationId: row.organization_id,
    contractNumber: row.contract_number,
    customerId: row.customer_id,
    supplierId: row.supplier_id,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    documentId: row.document_id,
    totalValue: row.total_value,
    currencyId: row.currency_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (items) {
    base.items = items.map(toContractItemResponse);
  }
  return base;
}

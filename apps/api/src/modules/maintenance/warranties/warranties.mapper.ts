import type {
  WarrantyClaimResponseDto,
  WarrantyResponseDto,
} from './dto/warranty.dto';
import type { ClaimStatus } from '../claim-statuses';
import type { WarrantyStatus, WarrantyType } from '../warranty-statuses';

export type WarrantyRow = {
  id: string;
  organization_id: string;
  product_id: string | null;
  serial_number_id: string | null;
  customer_id: string | null;
  sales_order_id: string | null;
  start_date: string;
  end_date: string | null;
  warranty_type: WarrantyType;
  terms: string | null;
  status: WarrantyStatus;
  created_at: string;
  updated_at: string;
};

export type WarrantyClaimRow = {
  id: string;
  warranty_id: string;
  ticket_id: string | null;
  claim_number: string;
  description: string | null;
  status: ClaimStatus;
  resolution: string | null;
  claimed_at: string;
  created_at: string;
  updated_at: string;
};

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

export function toWarrantyResponse(
  row: WarrantyRow,
  claims?: WarrantyClaimRow[],
): WarrantyResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    serialNumberId: row.serial_number_id,
    customerId: row.customer_id,
    salesOrderId: row.sales_order_id,
    startDate: toDateOnly(row.start_date)!,
    endDate: toDateOnly(row.end_date),
    warrantyType: row.warranty_type,
    terms: row.terms,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    claims: claims?.map(toWarrantyClaimResponse),
  };
}

export function toWarrantyClaimResponse(
  row: WarrantyClaimRow,
): WarrantyClaimResponseDto {
  return {
    id: row.id,
    warrantyId: row.warranty_id,
    ticketId: row.ticket_id,
    claimNumber: row.claim_number,
    description: row.description,
    status: row.status,
    resolution: row.resolution,
    claimedAt: row.claimed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

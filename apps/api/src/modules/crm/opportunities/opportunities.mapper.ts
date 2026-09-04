import type { OpportunityStage } from './dto/create-opportunity.dto';
import type { OpportunityItemResponseDto } from './dto/opportunity-item.dto';
import type { OpportunityResponseDto } from './dto/opportunity-response.dto';

export type OpportunityRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  lead_id: string | null;
  name: string;
  stage: OpportunityStage;
  probability: number;
  expected_close_date: string | null;
  amount: string | null;
  currency_id: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type OpportunityItemRow = {
  id: string;
  opportunity_id: string;
  product_id: string | null;
  service_id: string | null;
  description: string | null;
  quantity: string;
  unit_price: string;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export function toOpportunityResponse(
  row: OpportunityRow,
  items?: OpportunityItemResponseDto[],
): OpportunityResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    leadId: row.lead_id,
    name: row.name,
    stage: row.stage,
    probability: row.probability,
    expectedCloseDate: row.expected_close_date,
    amount: row.amount,
    currencyId: row.currency_id,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(items !== undefined ? { items } : {}),
  };
}

export function toOpportunityItemResponse(
  row: OpportunityItemRow,
): OpportunityItemResponseDto {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    productId: row.product_id,
    serviceId: row.service_id,
    description: row.description,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    lineTotal: row.line_total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Simple decimal string math (4 dp), sufficient for indicative CRM totals. */
export function formatDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid decimal value');
  }
  return value.toFixed(4);
}

export function resolveLineTotal(
  quantity: string,
  unitPrice: string,
  lineTotal?: string | null,
): string {
  if (lineTotal != null && lineTotal !== '') {
    return formatDecimal(Number(lineTotal));
  }
  return formatDecimal(Number(quantity) * Number(unitPrice));
}

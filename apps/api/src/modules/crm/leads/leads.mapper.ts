import type { LeadStatus } from './dto/create-lead.dto';
import type { LeadResponseDto } from './dto/lead-response.dto';

export type LeadRow = {
  id: string;
  organization_id: string;
  source_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  owner_user_id: string | null;
  estimated_value: string | null;
  currency_id: string | null;
  converted_customer_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toLeadResponse(row: LeadRow): LeadResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    sourceId: row.source_id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    ownerUserId: row.owner_user_id,
    estimatedValue: row.estimated_value,
    currencyId: row.currency_id,
    convertedCustomerId: row.converted_customer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

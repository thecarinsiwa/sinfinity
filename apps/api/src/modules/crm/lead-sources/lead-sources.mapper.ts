import type { LeadSourceResponseDto } from './dto/lead-source-response.dto';

export type LeadSourceRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toLeadSourceResponse(row: LeadSourceRow): LeadSourceResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

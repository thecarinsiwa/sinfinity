import type { SalesActivityRelatedType } from './dto/create-sales-activity.dto';
import type { SalesActivityResponseDto } from './dto/sales-activity-response.dto';

export type SalesActivityRow = {
  id: string;
  organization_id: string;
  activity_type_id: string | null;
  subject: string;
  description: string | null;
  related_type: string | null;
  related_id: string | null;
  user_id: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toSalesActivityResponse(
  row: SalesActivityRow,
): SalesActivityResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    activityTypeId: row.activity_type_id,
    subject: row.subject,
    description: row.description,
    relatedType: row.related_type as SalesActivityRelatedType | null,
    relatedId: row.related_id,
    userId: row.user_id,
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    outcome: row.outcome,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Normalize ISO datetime to MySQL DATETIME(3) string (same style as nowMysqlDateTime). */
export function toMysqlDateTime(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.replace('T', ' ').replace('Z', '');
}

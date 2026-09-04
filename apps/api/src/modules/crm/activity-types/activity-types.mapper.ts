import type { ActivityTypeResponseDto } from './dto/activity-type-response.dto';

export type ActivityTypeRow = {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

export function toActivityTypeResponse(
  row: ActivityTypeRow,
): ActivityTypeResponseDto {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    icon: row.icon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

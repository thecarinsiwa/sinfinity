import { SystemSettingResponseDto } from './dto/system-setting-response.dto';

export type SystemSettingRow = {
  id: string;
  organization_id: string;
  key: string;
  value: unknown;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export function toSystemSettingResponse(
  row: SystemSettingRow,
): SystemSettingResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    key: row.key,
    value: row.value ?? null,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

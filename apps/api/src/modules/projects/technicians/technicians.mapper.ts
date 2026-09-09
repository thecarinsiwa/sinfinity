import { toBool } from '../../settings/utils/mysql-datetime';
import type { TechnicianResponseDto } from './dto/technician.dto';

export type TechnicianRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  skills: unknown;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function parseSkills(value: unknown): string[] | null {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parseSkills(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export function toTechnicianResponse(
  row: TechnicianRow,
): TechnicianResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    skills: parseSkills(row.skills),
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

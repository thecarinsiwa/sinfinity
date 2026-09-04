import { toBool } from '../../settings/utils/mysql-datetime';
import type { BranchType } from './dto/create-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';

export type BranchRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  type: BranchType;
  address: string | null;
  city_id: string | null;
  phone: string | null;
  manager_user_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toBranchResponse(row: BranchRow): BranchResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    type: row.type,
    address: row.address,
    cityId: row.city_id,
    phone: row.phone,
    managerUserId: row.manager_user_id,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

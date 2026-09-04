import { toBool } from '../../settings/utils/mysql-datetime';
import { UserResponseDto } from './dto/user-response.dto';

export type UserRow = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: number;
  last_login_at: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toUserResponse(row: UserRow): UserResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    isActive: toBool(row.is_active),
    lastLoginAt: row.last_login_at,
    emailVerifiedAt: row.email_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

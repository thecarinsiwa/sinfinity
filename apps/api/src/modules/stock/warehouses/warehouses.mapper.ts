import { toBool } from '../../settings/utils/mysql-datetime';
import type { WarehouseResponseDto } from './dto/warehouse.dto';
import type { WarehouseLocationResponseDto } from './dto/warehouse-location.dto';

export type WarehouseRow = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  code: string;
  name: string;
  address: string | null;
  city_id: string | null;
  manager_user_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type WarehouseLocationRow = {
  id: string;
  warehouse_id: string;
  code: string;
  aisle: string | null;
  rack: string | null;
  shelf: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toWarehouseResponse(row: WarehouseRow): WarehouseResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id,
    code: row.code,
    name: row.name,
    address: row.address,
    cityId: row.city_id,
    managerUserId: row.manager_user_id,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toWarehouseLocationResponse(
  row: WarehouseLocationRow,
): WarehouseLocationResponseDto {
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    code: row.code,
    aisle: row.aisle,
    rack: row.rack,
    shelf: row.shelf,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

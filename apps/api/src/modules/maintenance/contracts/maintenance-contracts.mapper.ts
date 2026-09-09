import { toBool } from '../../settings/utils/mysql-datetime';
import type {
  MaintenanceContractItemResponseDto,
  MaintenanceContractResponseDto,
  MaintenanceScheduleResponseDto,
} from './dto/maintenance-contract.dto';
import type { ContractStatus } from '../contract-statuses';
import type { ScheduleFrequency } from '../schedule-frequencies';

export type MaintenanceContractRow = {
  id: string;
  organization_id: string;
  contract_number: string;
  customer_id: string;
  start_date: string;
  end_date: string | null;
  sla_hours: number | null;
  status: ContractStatus;
  amount: string | null;
  currency_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MaintenanceContractItemRow = {
  id: string;
  maintenance_contract_id: string;
  product_id: string | null;
  serial_number_id: string | null;
  coverage_level: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceScheduleRow = {
  id: string;
  maintenance_contract_id: string;
  title: string;
  frequency: ScheduleFrequency;
  next_due_at: string | null;
  technician_id: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

export function toMaintenanceContractResponse(
  row: MaintenanceContractRow,
  items?: MaintenanceContractItemRow[],
  schedules?: MaintenanceScheduleRow[],
): MaintenanceContractResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    contractNumber: row.contract_number,
    customerId: row.customer_id,
    startDate: toDateOnly(row.start_date)!,
    endDate: toDateOnly(row.end_date),
    slaHours: row.sla_hours,
    status: row.status,
    amount: row.amount,
    currencyId: row.currency_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    items: items?.map(toMaintenanceContractItemResponse),
    schedules: schedules?.map(toMaintenanceScheduleResponse),
  };
}

export function toMaintenanceContractItemResponse(
  row: MaintenanceContractItemRow,
): MaintenanceContractItemResponseDto {
  return {
    id: row.id,
    maintenanceContractId: row.maintenance_contract_id,
    productId: row.product_id,
    serialNumberId: row.serial_number_id,
    coverageLevel: row.coverage_level,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMaintenanceScheduleResponse(
  row: MaintenanceScheduleRow,
): MaintenanceScheduleResponseDto {
  return {
    id: row.id,
    maintenanceContractId: row.maintenance_contract_id,
    title: row.title,
    frequency: row.frequency,
    nextDueAt: toDateOnly(row.next_due_at),
    technicianId: row.technician_id,
    isActive: toBool(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

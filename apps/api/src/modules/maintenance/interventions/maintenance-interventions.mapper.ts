import type {
  MaintenanceInterventionResponseDto,
  MaintenanceReportResponseDto,
} from './dto/maintenance-intervention.dto';
import type {
  InterventionStatus,
  InterventionType,
} from '../intervention-statuses';

export type MaintenanceInterventionRow = {
  id: string;
  organization_id: string;
  ticket_id: string | null;
  schedule_id: string | null;
  contract_id: string | null;
  customer_id: string;
  technician_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  intervention_type: InterventionType;
  status: InterventionStatus;
  created_at: string;
  updated_at: string;
};

export type MaintenanceReportRow = {
  id: string;
  intervention_id: string;
  summary: string | null;
  actions_taken: string | null;
  parts_used: unknown;
  document_ids: unknown;
  reported_at: string;
  created_at: string;
};

export function parseDocumentIds(value: unknown): string[] | null {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parseDocumentIds(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export function parsePartsUsed(
  value: unknown,
): Record<string, unknown> | unknown[] | null {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value as unknown[];
  }
  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsePartsUsed(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export function toMaintenanceInterventionResponse(
  row: MaintenanceInterventionRow,
  reports?: MaintenanceReportRow[],
): MaintenanceInterventionResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ticketId: row.ticket_id,
    scheduleId: row.schedule_id,
    contractId: row.contract_id,
    customerId: row.customer_id,
    technicianId: row.technician_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    interventionType: row.intervention_type,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reports: reports?.map(toMaintenanceReportResponse),
  };
}

export function toMaintenanceReportResponse(
  row: MaintenanceReportRow,
): MaintenanceReportResponseDto {
  return {
    id: row.id,
    interventionId: row.intervention_id,
    summary: row.summary,
    actionsTaken: row.actions_taken,
    partsUsed: parsePartsUsed(row.parts_used),
    documentIds: parseDocumentIds(row.document_ids),
    reportedAt: row.reported_at,
    createdAt: row.created_at,
  };
}

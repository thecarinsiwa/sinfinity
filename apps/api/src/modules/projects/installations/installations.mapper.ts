import type {
  InstallationItemResponseDto,
  InstallationResponseDto,
  InstallationTaskResponseDto,
} from './dto/installation.dto';
import type { InstallationStatus } from '../installation-statuses';
import type { InstallationTaskStatus } from '../installation-task-statuses';

export type InstallationRow = {
  id: string;
  project_id: string;
  name: string;
  site_location: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  status: InstallationStatus;
  lead_technician_id: string | null;
  created_at: string;
  updated_at: string;
};

export type InstallationItemRow = {
  id: string;
  installation_id: string;
  product_id: string | null;
  serial_number_id: string | null;
  quantity: string;
  installed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InstallationTaskRow = {
  id: string;
  installation_id: string;
  title: string;
  description: string | null;
  technician_id: string | null;
  status: InstallationTaskStatus;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export function toInstallationResponse(
  row: InstallationRow,
  items?: InstallationItemRow[],
  tasks?: InstallationTaskRow[],
): InstallationResponseDto {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    siteLocation: row.site_location,
    scheduledAt: row.scheduled_at,
    completedAt: row.completed_at,
    status: row.status,
    leadTechnicianId: row.lead_technician_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items?.map(toInstallationItemResponse),
    tasks: tasks?.map(toInstallationTaskResponse),
  };
}

export function toInstallationItemResponse(
  row: InstallationItemRow,
): InstallationItemResponseDto {
  return {
    id: row.id,
    installationId: row.installation_id,
    productId: row.product_id,
    serialNumberId: row.serial_number_id,
    quantity: row.quantity,
    installedAt: row.installed_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toInstallationTaskResponse(
  row: InstallationTaskRow,
): InstallationTaskResponseDto {
  return {
    id: row.id,
    installationId: row.installation_id,
    title: row.title,
    description: row.description,
    technicianId: row.technician_id,
    status: row.status,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

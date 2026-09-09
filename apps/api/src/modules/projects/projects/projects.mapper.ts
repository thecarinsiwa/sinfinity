import type {
  ProjectItemResponseDto,
  ProjectResponseDto,
} from './dto/project.dto';
import type { ProjectStatus } from '../project-statuses';

export type ProjectRow = {
  id: string;
  organization_id: string;
  project_number: string;
  name: string;
  customer_id: string;
  sales_order_id: string | null;
  manager_user_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  site_address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
};

export type ProjectItemRow = {
  id: string;
  project_id: string;
  product_id: string | null;
  service_id: string | null;
  quantity: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

function toDateOnly(value: string | null | undefined): string | null {
  if (value == null) return null;
  return value.slice(0, 10);
}

export function toProjectResponse(
  row: ProjectRow,
  items?: ProjectItemRow[],
): ProjectResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectNumber: row.project_number,
    name: row.name,
    customerId: row.customer_id,
    salesOrderId: row.sales_order_id,
    managerUserId: row.manager_user_id,
    startDate: toDateOnly(row.start_date),
    endDate: toDateOnly(row.end_date),
    status: row.status,
    siteAddress: row.site_address,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    deletedAt: row.deleted_at,
    items: items?.map(toProjectItemResponse),
  };
}

export function toProjectItemResponse(
  row: ProjectItemRow,
): ProjectItemResponseDto {
  return {
    id: row.id,
    projectId: row.project_id,
    productId: row.product_id,
    serviceId: row.service_id,
    quantity: row.quantity,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

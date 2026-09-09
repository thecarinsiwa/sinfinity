import type { ServiceRequestResponseDto } from './dto/service-request.dto';
import type { ServiceRequestStatus } from '../service-request-statuses';

export type ServiceRequestRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  request_type: string | null;
  description: string | null;
  status: ServiceRequestStatus;
  converted_ticket_id: string | null;
  requested_at: string;
  created_at: string;
  updated_at: string;
};

export function toServiceRequestResponse(
  row: ServiceRequestRow,
): ServiceRequestResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    requestType: row.request_type,
    description: row.description,
    status: row.status,
    convertedTicketId: row.converted_ticket_id,
    requestedAt: row.requested_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

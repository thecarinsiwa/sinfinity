import type { SupportTicketResponseDto } from './dto/support-ticket.dto';
import type { TicketPriority, TicketStatus } from '../ticket-statuses';

export type SupportTicketRow = {
  id: string;
  organization_id: string;
  ticket_number: string;
  customer_id: string;
  contact_id: string | null;
  subject: string;
  description: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  related_serial_number_id: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function toSupportTicketResponse(
  row: SupportTicketRow,
): SupportTicketResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ticketNumber: row.ticket_number,
    customerId: row.customer_id,
    contactId: row.contact_id,
    subject: row.subject,
    description: row.description,
    priority: row.priority,
    status: row.status,
    assignedTo: row.assigned_to,
    relatedSerialNumberId: row.related_serial_number_id,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

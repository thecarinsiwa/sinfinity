import type {
  AppointmentStatus,
  MeetingType,
} from '../appointment-statuses';
import type { AppointmentResponseDto } from './dto/appointment.dto';

export type AppointmentRow = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  meeting_type: MeetingType;
  organizer_id: string | null;
  customer_id: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function appointmentAtToMysql(value: string): string {
  return value.replace('T', ' ').replace('Z', '').slice(0, 23);
}

export function toAppointmentResponse(
  row: AppointmentRow,
): AppointmentResponseDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    startAt: row.start_at,
    endAt: row.end_at,
    location: row.location,
    meetingType: row.meeting_type,
    organizerId: row.organizer_id,
    customerId: row.customer_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

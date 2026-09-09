export const MEETING_TYPES = ['in_person', 'online', 'phone'] as const;

export type MeetingType = (typeof MEETING_TYPES)[number];

export const MEETING_TYPE = {
  IN_PERSON: 'in_person',
  ONLINE: 'online',
  PHONE: 'phone',
} as const satisfies Record<string, MeetingType>;

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const satisfies Record<string, AppointmentStatus>;

/**
 * scheduled → completed|cancelled|no_show
 * completed / cancelled / no_show terminal
 */
export const APPOINTMENT_STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  readonly AppointmentStatus[]
> = {
  scheduled: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function assertAppointmentTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): void {
  if (from === to) {
    throw new Error(`Appointment is already "${from}"`);
  }
  const allowed = APPOINTMENT_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

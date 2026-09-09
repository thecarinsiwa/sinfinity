export const SCHEDULE_FREQUENCIES = [
  'monthly',
  'quarterly',
  'yearly',
  'custom',
] as const;

export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

export const SCHEDULE_FREQUENCY = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
} as const satisfies Record<string, ScheduleFrequency>;

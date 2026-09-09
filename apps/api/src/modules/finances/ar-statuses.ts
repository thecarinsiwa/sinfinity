export const AR_STATUSES = [
  'open',
  'partial',
  'closed',
  'written_off',
] as const;

export type ArStatus = (typeof AR_STATUSES)[number];

export const AR_STATUS = {
  OPEN: 'open',
  PARTIAL: 'partial',
  CLOSED: 'closed',
  WRITTEN_OFF: 'written_off',
} as const satisfies Record<string, ArStatus>;

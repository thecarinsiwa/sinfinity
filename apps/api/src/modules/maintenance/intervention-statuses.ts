export const INTERVENTION_TYPES = [
  'preventive',
  'corrective',
  'inspection',
] as const;

export type InterventionType = (typeof INTERVENTION_TYPES)[number];

export const INTERVENTION_TYPE = {
  PREVENTIVE: 'preventive',
  CORRECTIVE: 'corrective',
  INSPECTION: 'inspection',
} as const satisfies Record<string, InterventionType>;

export const INTERVENTION_STATUSES = ['planned', 'done', 'cancelled'] as const;

export type InterventionStatus = (typeof INTERVENTION_STATUSES)[number];

export const INTERVENTION_STATUS = {
  PLANNED: 'planned',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, InterventionStatus>;

/**
 * planned → done|cancelled
 */
export const INTERVENTION_STATUS_TRANSITIONS: Record<
  InterventionStatus,
  readonly InterventionStatus[]
> = {
  planned: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

export function assertInterventionTransition(
  from: InterventionStatus,
  to: InterventionStatus,
): void {
  if (from === to) {
    throw new Error(`Intervention is already "${from}"`);
  }
  const allowed = INTERVENTION_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

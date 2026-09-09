export const PROJECT_STATUSES = [
  'planned',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, ProjectStatus>;

/**
 * planned → in_progress → completed
 * on_hold from in_progress; cancel until completed.
 */
export const PROJECT_STATUS_TRANSITIONS: Record<
  ProjectStatus,
  readonly ProjectStatus[]
> = {
  planned: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'cancelled'],
  on_hold: ['in_progress', 'cancelled'],
  completed: [],
  cancelled: [],
};

export function assertProjectTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): void {
  if (from === to) {
    throw new Error(`Project is already "${from}"`);
  }
  const allowed = PROJECT_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

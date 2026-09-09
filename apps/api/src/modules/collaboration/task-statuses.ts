export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const satisfies Record<string, TaskPriority>;

export const TASK_STATUSES = [
  'todo',
  'in_progress',
  'done',
  'cancelled',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, TaskStatus>;

/**
 * todo → in_progress|cancelled
 * in_progress → done|cancelled|todo
 * done / cancelled terminal
 */
export const TASK_STATUS_TRANSITIONS: Record<
  TaskStatus,
  readonly TaskStatus[]
> = {
  todo: ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled', 'todo'],
  done: [],
  cancelled: [],
};

export function assertTaskTransition(
  from: TaskStatus,
  to: TaskStatus,
): void {
  if (from === to) {
    throw new Error(`Task is already "${from}"`);
  }
  const allowed = TASK_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

export const INSTALLATION_TASK_STATUSES = [
  'todo',
  'in_progress',
  'done',
  'blocked',
] as const;

export type InstallationTaskStatus =
  (typeof INSTALLATION_TASK_STATUSES)[number];

export const INSTALLATION_TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  BLOCKED: 'blocked',
} as const satisfies Record<string, InstallationTaskStatus>;

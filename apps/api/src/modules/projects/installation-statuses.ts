export const INSTALLATION_STATUSES = [
  'planned',
  'ongoing',
  'completed',
  'failed',
] as const;

export type InstallationStatus = (typeof INSTALLATION_STATUSES)[number];

export const INSTALLATION_STATUS = {
  PLANNED: 'planned',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const satisfies Record<string, InstallationStatus>;

/**
 * planned → ongoing → completed|failed
 * fail from planned as well.
 */
export const INSTALLATION_STATUS_TRANSITIONS: Record<
  InstallationStatus,
  readonly InstallationStatus[]
> = {
  planned: ['ongoing', 'failed'],
  ongoing: ['completed', 'failed'],
  completed: [],
  failed: [],
};

export function assertInstallationTransition(
  from: InstallationStatus,
  to: InstallationStatus,
): void {
  if (from === to) {
    throw new Error(`Installation is already "${from}"`);
  }
  const allowed = INSTALLATION_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

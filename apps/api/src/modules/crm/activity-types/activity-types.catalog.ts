/**
 * Global activity types (no organization scope).
 * Seeded idempotently via ActivityTypesSeedService.
 */
export type ActivityTypeDef = {
  code: string;
  name: string;
  icon: string;
};

export const SYSTEM_ACTIVITY_TYPES: ActivityTypeDef[] = [
  { code: 'CALL', name: 'Call', icon: 'phone' },
  { code: 'EMAIL', name: 'Email', icon: 'mail' },
  { code: 'MEETING', name: 'Meeting', icon: 'users' },
  { code: 'VISIT', name: 'Visit', icon: 'map-pin' },
];

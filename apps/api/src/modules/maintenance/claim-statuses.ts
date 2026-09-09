export const CLAIM_STATUSES = [
  'submitted',
  'approved',
  'rejected',
  'fulfilled',
] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_STATUS = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FULFILLED: 'fulfilled',
} as const satisfies Record<string, ClaimStatus>;

/**
 * submitted → approved|rejected|fulfilled (all terminal)
 */
export const CLAIM_STATUS_TRANSITIONS: Record<
  ClaimStatus,
  readonly ClaimStatus[]
> = {
  submitted: ['approved', 'rejected', 'fulfilled'],
  approved: [],
  rejected: [],
  fulfilled: [],
};

export function assertClaimTransition(
  from: ClaimStatus,
  to: ClaimStatus,
): void {
  if (from === to) {
    throw new Error(`Claim is already "${from}"`);
  }
  const allowed = CLAIM_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

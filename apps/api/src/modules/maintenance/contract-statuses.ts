export const CONTRACT_STATUSES = [
  'draft',
  'active',
  'expired',
  'cancelled',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, ContractStatus>;

/**
 * draft → active → expired|cancelled
 * cancel from draft or active.
 */
export const CONTRACT_STATUS_TRANSITIONS: Record<
  ContractStatus,
  readonly ContractStatus[]
> = {
  draft: ['active', 'cancelled'],
  active: ['expired', 'cancelled'],
  expired: [],
  cancelled: [],
};

export function assertContractTransition(
  from: ContractStatus,
  to: ContractStatus,
): void {
  if (from === to) {
    throw new Error(`Contract is already "${from}"`);
  }
  const allowed = CONTRACT_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

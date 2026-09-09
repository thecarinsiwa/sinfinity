/** Landed cost workflow statuses (DDL enum). */
export const LANDED_COST_STATUSES = ['draft', 'calculated', 'posted'] as const;

export type LandedCostStatus = (typeof LANDED_COST_STATUSES)[number];

export const LANDED_COST_STATUS = {
  DRAFT: 'draft',
  CALCULATED: 'calculated',
  POSTED: 'posted',
} as const satisfies Record<string, LandedCostStatus>;

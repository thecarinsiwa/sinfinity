export const WARRANTY_TYPES = ['manufacturer', 'seller', 'extended'] as const;

export type WarrantyType = (typeof WARRANTY_TYPES)[number];

export const WARRANTY_TYPE = {
  MANUFACTURER: 'manufacturer',
  SELLER: 'seller',
  EXTENDED: 'extended',
} as const satisfies Record<string, WarrantyType>;

export const WARRANTY_STATUSES = ['active', 'expired', 'void'] as const;

export type WarrantyStatus = (typeof WARRANTY_STATUSES)[number];

export const WARRANTY_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  VOID: 'void',
} as const satisfies Record<string, WarrantyStatus>;

/**
 * active → expired|void
 */
export const WARRANTY_STATUS_TRANSITIONS: Record<
  WarrantyStatus,
  readonly WarrantyStatus[]
> = {
  active: ['expired', 'void'],
  expired: [],
  void: [],
};

export function assertWarrantyTransition(
  from: WarrantyStatus,
  to: WarrantyStatus,
): void {
  if (from === to) {
    throw new Error(`Warranty is already "${from}"`);
  }
  const allowed = WARRANTY_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

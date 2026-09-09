export const PAYMENT_STATUSES = [
  'pending',
  'confirmed',
  'failed',
  'reversed',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  REVERSED: 'reversed',
} as const satisfies Record<string, PaymentStatus>;

/** Suggested org codes (varchar, not SQL enum). */
export const PAYMENT_METHOD_CODES = [
  'CASH',
  'BANK',
  'MOBILE_MONEY',
  'WIRE',
] as const;

export type PaymentMethodCode = (typeof PAYMENT_METHOD_CODES)[number];

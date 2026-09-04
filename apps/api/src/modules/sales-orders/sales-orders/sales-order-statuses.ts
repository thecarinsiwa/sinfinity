export const SALES_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'partially_delivered',
  'delivered',
  'cancelled',
] as const;

export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];

export const SALES_ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  PARTIALLY_DELIVERED: 'partially_delivered',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, SalesOrderStatus>;

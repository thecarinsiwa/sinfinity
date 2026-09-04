export const PURCHASE_ORDER_STATUSES = [
  'draft',
  'sent',
  'confirmed',
  'partial',
  'received',
  'closed',
  'cancelled',
] as const;

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  CONFIRMED: 'confirmed',
  PARTIAL: 'partial',
  RECEIVED: 'received',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const satisfies Record<string, PurchaseOrderStatus>;

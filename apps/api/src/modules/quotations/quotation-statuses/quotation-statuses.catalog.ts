/**
 * Global quotation workflow statuses (no organization scope).
 * Seeded idempotently via QuotationStatusesSeedService.
 */
export type QuotationStatusDef = {
  code: string;
  name: string;
  isFinal: boolean;
  sortOrder: number;
};

export const SYSTEM_QUOTATION_STATUSES: QuotationStatusDef[] = [
  { code: 'DRAFT', name: 'Draft', isFinal: false, sortOrder: 10 },
  { code: 'SENT', name: 'Sent', isFinal: false, sortOrder: 20 },
  { code: 'ACCEPTED', name: 'Accepted', isFinal: true, sortOrder: 30 },
  { code: 'REJECTED', name: 'Rejected', isFinal: true, sortOrder: 40 },
  { code: 'EXPIRED', name: 'Expired', isFinal: true, sortOrder: 50 },
];

export const QUOTATION_STATUS_CODE = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;

export type QuotationStatusCode =
  (typeof QUOTATION_STATUS_CODE)[keyof typeof QUOTATION_STATUS_CODE];

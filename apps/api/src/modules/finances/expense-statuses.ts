export const EXPENSE_STATUSES = [
  'draft',
  'approved',
  'paid',
  'rejected',
] as const;

export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const EXPENSE_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected',
} as const satisfies Record<string, ExpenseStatus>;

/**
 * draft → approved|rejected
 * approved → paid
 * rejected / paid terminal
 */
export const EXPENSE_STATUS_TRANSITIONS: Record<
  ExpenseStatus,
  readonly ExpenseStatus[]
> = {
  draft: ['approved', 'rejected'],
  approved: ['paid'],
  paid: [],
  rejected: [],
};

export function assertExpenseTransition(
  from: ExpenseStatus,
  to: ExpenseStatus,
): void {
  if (from === to) {
    throw new Error(`Expense is already "${from}"`);
  }
  const allowed = EXPENSE_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

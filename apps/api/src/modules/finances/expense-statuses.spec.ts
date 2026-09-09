import {
  assertExpenseTransition,
  EXPENSE_STATUS,
} from './expense-statuses';

describe('expense-statuses', () => {
  it('allows draft → approved|rejected and approved → paid', () => {
    expect(() =>
      assertExpenseTransition(EXPENSE_STATUS.DRAFT, EXPENSE_STATUS.APPROVED),
    ).not.toThrow();
    expect(() =>
      assertExpenseTransition(EXPENSE_STATUS.DRAFT, EXPENSE_STATUS.REJECTED),
    ).not.toThrow();
    expect(() =>
      assertExpenseTransition(EXPENSE_STATUS.APPROVED, EXPENSE_STATUS.PAID),
    ).not.toThrow();
  });

  it('rejects reverse from paid', () => {
    expect(() =>
      assertExpenseTransition(EXPENSE_STATUS.PAID, EXPENSE_STATUS.APPROVED),
    ).toThrow(/Invalid status transition/);
  });
});

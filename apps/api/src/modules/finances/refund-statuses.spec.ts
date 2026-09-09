import {
  assertRefundTransition,
  REFUND_STATUS,
} from './refund-statuses';

describe('refund-statuses', () => {
  it('allows draft → issued → applied', () => {
    expect(() =>
      assertRefundTransition(REFUND_STATUS.DRAFT, REFUND_STATUS.ISSUED),
    ).not.toThrow();
    expect(() =>
      assertRefundTransition(REFUND_STATUS.ISSUED, REFUND_STATUS.APPLIED),
    ).not.toThrow();
  });

  it('rejects draft → applied', () => {
    expect(() =>
      assertRefundTransition(REFUND_STATUS.DRAFT, REFUND_STATUS.APPLIED),
    ).toThrow(/Invalid status transition/);
  });
});

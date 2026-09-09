import { assertClaimTransition, CLAIM_STATUS } from './claim-statuses';

describe('claim-statuses', () => {
  it('allows submitted → approved|rejected|fulfilled', () => {
    expect(() =>
      assertClaimTransition(CLAIM_STATUS.SUBMITTED, CLAIM_STATUS.APPROVED),
    ).not.toThrow();
    expect(() =>
      assertClaimTransition(CLAIM_STATUS.SUBMITTED, CLAIM_STATUS.REJECTED),
    ).not.toThrow();
    expect(() =>
      assertClaimTransition(CLAIM_STATUS.SUBMITTED, CLAIM_STATUS.FULFILLED),
    ).not.toThrow();
  });

  it('rejects transitions from terminal statuses', () => {
    expect(() =>
      assertClaimTransition(CLAIM_STATUS.APPROVED, CLAIM_STATUS.FULFILLED),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertClaimTransition(CLAIM_STATUS.REJECTED, CLAIM_STATUS.SUBMITTED),
    ).toThrow(/Invalid status transition/);
  });
});

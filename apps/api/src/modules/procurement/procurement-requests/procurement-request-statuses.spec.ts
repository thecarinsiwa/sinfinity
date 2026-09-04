import {
  assertProcurementRequestTransition,
  PROCUREMENT_REQUEST_STATUS,
} from './procurement-request-statuses';

describe('procurement-request-statuses', () => {
  it('allows the forward happy path and cancel branches', () => {
    expect(() =>
      assertProcurementRequestTransition(
        PROCUREMENT_REQUEST_STATUS.DRAFT,
        PROCUREMENT_REQUEST_STATUS.OPEN,
      ),
    ).not.toThrow();
    expect(() =>
      assertProcurementRequestTransition(
        PROCUREMENT_REQUEST_STATUS.OPEN,
        PROCUREMENT_REQUEST_STATUS.QUOTED,
      ),
    ).not.toThrow();
    expect(() =>
      assertProcurementRequestTransition(
        PROCUREMENT_REQUEST_STATUS.COMPARED,
        PROCUREMENT_REQUEST_STATUS.APPROVED,
      ),
    ).not.toThrow();
    expect(() =>
      assertProcurementRequestTransition(
        PROCUREMENT_REQUEST_STATUS.OPEN,
        PROCUREMENT_REQUEST_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse and terminal transitions', () => {
    expect(() =>
      assertProcurementRequestTransition(
        PROCUREMENT_REQUEST_STATUS.OPEN,
        PROCUREMENT_REQUEST_STATUS.DRAFT,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertProcurementRequestTransition(
        PROCUREMENT_REQUEST_STATUS.APPROVED,
        PROCUREMENT_REQUEST_STATUS.CANCELLED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertProcurementRequestTransition(
        PROCUREMENT_REQUEST_STATUS.CLOSED,
        PROCUREMENT_REQUEST_STATUS.OPEN,
      ),
    ).toThrow(/Invalid status transition/);
  });
});

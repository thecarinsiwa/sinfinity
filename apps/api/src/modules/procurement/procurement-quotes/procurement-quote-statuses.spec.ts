import {
  assertProcurementQuoteTransition,
  PROCUREMENT_QUOTE_STATUS,
} from './procurement-quote-statuses';

describe('procurement-quote-statuses', () => {
  it('allows shortlist then select, and reject', () => {
    expect(() =>
      assertProcurementQuoteTransition(
        PROCUREMENT_QUOTE_STATUS.RECEIVED,
        PROCUREMENT_QUOTE_STATUS.SHORTLISTED,
      ),
    ).not.toThrow();
    expect(() =>
      assertProcurementQuoteTransition(
        PROCUREMENT_QUOTE_STATUS.SHORTLISTED,
        PROCUREMENT_QUOTE_STATUS.SELECTED,
      ),
    ).not.toThrow();
    expect(() =>
      assertProcurementQuoteTransition(
        PROCUREMENT_QUOTE_STATUS.RECEIVED,
        PROCUREMENT_QUOTE_STATUS.REJECTED,
      ),
    ).not.toThrow();
  });

  it('rejects skipping shortlisted and reverse from rejected', () => {
    expect(() =>
      assertProcurementQuoteTransition(
        PROCUREMENT_QUOTE_STATUS.RECEIVED,
        PROCUREMENT_QUOTE_STATUS.SELECTED,
      ),
    ).toThrow(/Invalid quote status transition/);
    expect(() =>
      assertProcurementQuoteTransition(
        PROCUREMENT_QUOTE_STATUS.REJECTED,
        PROCUREMENT_QUOTE_STATUS.RECEIVED,
      ),
    ).toThrow(/Invalid quote status transition/);
  });
});

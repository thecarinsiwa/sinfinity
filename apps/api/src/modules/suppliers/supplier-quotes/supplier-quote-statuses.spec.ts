import {
  assertSupplierQuoteMutable,
  assertSupplierQuoteTransition,
  SUPPLIER_QUOTE_STATUS,
} from './supplier-quote-statuses';

describe('supplier-quote-statuses', () => {
  it('allows draft → received → selected', () => {
    expect(() =>
      assertSupplierQuoteTransition(
        SUPPLIER_QUOTE_STATUS.DRAFT,
        SUPPLIER_QUOTE_STATUS.RECEIVED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSupplierQuoteTransition(
        SUPPLIER_QUOTE_STATUS.RECEIVED,
        SUPPLIER_QUOTE_STATUS.SELECTED,
      ),
    ).not.toThrow();
  });

  it('allows reject/expire from draft and received', () => {
    expect(() =>
      assertSupplierQuoteTransition(
        SUPPLIER_QUOTE_STATUS.DRAFT,
        SUPPLIER_QUOTE_STATUS.REJECTED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSupplierQuoteTransition(
        SUPPLIER_QUOTE_STATUS.RECEIVED,
        SUPPLIER_QUOTE_STATUS.EXPIRED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse from selected', () => {
    expect(() =>
      assertSupplierQuoteTransition(
        SUPPLIER_QUOTE_STATUS.SELECTED,
        SUPPLIER_QUOTE_STATUS.RECEIVED,
      ),
    ).toThrow(/Invalid supplier quote status transition/);
  });

  it('allows mutate only in draft|received', () => {
    expect(() =>
      assertSupplierQuoteMutable(SUPPLIER_QUOTE_STATUS.DRAFT),
    ).not.toThrow();
    expect(() =>
      assertSupplierQuoteMutable(SUPPLIER_QUOTE_STATUS.SELECTED),
    ).toThrow(/Cannot modify/);
  });
});

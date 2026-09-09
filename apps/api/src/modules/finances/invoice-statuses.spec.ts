import {
  assertInvoiceTransition,
  INVOICE_STATUS,
  invoiceStatusFromPayments,
} from './invoice-statuses';

describe('invoice-statuses', () => {
  it('allows draft → issued and payment branches', () => {
    expect(() =>
      assertInvoiceTransition(INVOICE_STATUS.DRAFT, INVOICE_STATUS.ISSUED),
    ).not.toThrow();
    expect(() =>
      assertInvoiceTransition(
        INVOICE_STATUS.ISSUED,
        INVOICE_STATUS.PARTIALLY_PAID,
      ),
    ).not.toThrow();
    expect(() =>
      assertInvoiceTransition(INVOICE_STATUS.ISSUED, INVOICE_STATUS.PAID),
    ).not.toThrow();
  });

  it('rejects reverse from paid', () => {
    expect(() =>
      assertInvoiceTransition(INVOICE_STATUS.PAID, INVOICE_STATUS.ISSUED),
    ).toThrow(/Invalid status transition/);
  });

  it('derives status from amounts', () => {
    expect(
      invoiceStatusFromPayments('0', '100', INVOICE_STATUS.ISSUED),
    ).toBe(INVOICE_STATUS.ISSUED);
    expect(
      invoiceStatusFromPayments('40', '100', INVOICE_STATUS.ISSUED),
    ).toBe(INVOICE_STATUS.PARTIALLY_PAID);
    expect(
      invoiceStatusFromPayments('100', '100', INVOICE_STATUS.ISSUED),
    ).toBe(INVOICE_STATUS.PAID);
  });
});

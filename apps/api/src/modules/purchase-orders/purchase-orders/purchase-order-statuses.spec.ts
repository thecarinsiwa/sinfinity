import {
  assertPurchaseOrderTransition,
  assertReceiptQtyInvariants,
  PURCHASE_ORDER_STATUS,
} from './purchase-order-statuses';

describe('purchase-order-statuses', () => {
  it('allows the forward happy path and cancel branches', () => {
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.DRAFT,
        PURCHASE_ORDER_STATUS.SENT,
      ),
    ).not.toThrow();
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.SENT,
        PURCHASE_ORDER_STATUS.CONFIRMED,
      ),
    ).not.toThrow();
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.CONFIRMED,
        PURCHASE_ORDER_STATUS.PARTIAL,
      ),
    ).not.toThrow();
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.PARTIAL,
        PURCHASE_ORDER_STATUS.RECEIVED,
      ),
    ).not.toThrow();
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.RECEIVED,
        PURCHASE_ORDER_STATUS.CLOSED,
      ),
    ).not.toThrow();
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.DRAFT,
        PURCHASE_ORDER_STATUS.CANCELLED,
      ),
    ).not.toThrow();
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.PARTIAL,
        PURCHASE_ORDER_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse, skip, and terminal transitions', () => {
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.SENT,
        PURCHASE_ORDER_STATUS.DRAFT,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.CONFIRMED,
        PURCHASE_ORDER_STATUS.RECEIVED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.RECEIVED,
        PURCHASE_ORDER_STATUS.CANCELLED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertPurchaseOrderTransition(
        PURCHASE_ORDER_STATUS.CLOSED,
        PURCHASE_ORDER_STATUS.CANCELLED,
      ),
    ).toThrow(/Invalid status transition/);
  });

  it('enforces partial and received qty invariants', () => {
    expect(() =>
      assertReceiptQtyInvariants(PURCHASE_ORDER_STATUS.PARTIAL, [
        { quantity: '10', quantityReceived: '0' },
      ]),
    ).toThrow(/partial/);

    expect(() =>
      assertReceiptQtyInvariants(PURCHASE_ORDER_STATUS.PARTIAL, [
        { quantity: '10', quantityReceived: '4' },
      ]),
    ).not.toThrow();

    expect(() =>
      assertReceiptQtyInvariants(PURCHASE_ORDER_STATUS.RECEIVED, [
        { quantity: '10', quantityReceived: '4' },
      ]),
    ).toThrow(/received requires/);

    expect(() =>
      assertReceiptQtyInvariants(PURCHASE_ORDER_STATUS.RECEIVED, [
        { quantity: '10', quantityReceived: '10' },
      ]),
    ).not.toThrow();
  });
});

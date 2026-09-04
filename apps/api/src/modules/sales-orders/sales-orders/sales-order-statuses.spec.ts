import {
  assertDeliveryQtyInvariants,
  assertSalesOrderTransition,
  SALES_ORDER_STATUS,
} from './sales-order-statuses';

describe('sales-order-statuses', () => {
  it('allows the forward happy path and cancel branches', () => {
    expect(() =>
      assertSalesOrderTransition(
        SALES_ORDER_STATUS.PENDING,
        SALES_ORDER_STATUS.CONFIRMED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSalesOrderTransition(
        SALES_ORDER_STATUS.CONFIRMED,
        SALES_ORDER_STATUS.IN_PROGRESS,
      ),
    ).not.toThrow();
    expect(() =>
      assertSalesOrderTransition(
        SALES_ORDER_STATUS.IN_PROGRESS,
        SALES_ORDER_STATUS.PARTIALLY_DELIVERED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSalesOrderTransition(
        SALES_ORDER_STATUS.PARTIALLY_DELIVERED,
        SALES_ORDER_STATUS.DELIVERED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSalesOrderTransition(
        SALES_ORDER_STATUS.PENDING,
        SALES_ORDER_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse and terminal transitions', () => {
    expect(() =>
      assertSalesOrderTransition(
        SALES_ORDER_STATUS.CONFIRMED,
        SALES_ORDER_STATUS.PENDING,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertSalesOrderTransition(
        SALES_ORDER_STATUS.DELIVERED,
        SALES_ORDER_STATUS.CANCELLED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertSalesOrderTransition(
        SALES_ORDER_STATUS.IN_PROGRESS,
        SALES_ORDER_STATUS.DELIVERED,
      ),
    ).toThrow(/Invalid status transition/);
  });

  it('enforces partially_delivered and delivered qty invariants', () => {
    expect(() =>
      assertDeliveryQtyInvariants(SALES_ORDER_STATUS.PARTIALLY_DELIVERED, [
        { quantity: '10', quantityDelivered: '0' },
      ]),
    ).toThrow(/partially_delivered/);

    expect(() =>
      assertDeliveryQtyInvariants(SALES_ORDER_STATUS.PARTIALLY_DELIVERED, [
        { quantity: '10', quantityDelivered: '4' },
      ]),
    ).not.toThrow();

    expect(() =>
      assertDeliveryQtyInvariants(SALES_ORDER_STATUS.DELIVERED, [
        { quantity: '10', quantityDelivered: '4' },
      ]),
    ).toThrow(/delivered requires/);

    expect(() =>
      assertDeliveryQtyInvariants(SALES_ORDER_STATUS.DELIVERED, [
        { quantity: '10', quantityDelivered: '10' },
      ]),
    ).not.toThrow();
  });
});

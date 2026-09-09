import {
  assertDeliveryTransition,
  DELIVERY_STATUS,
} from './delivery-statuses';

describe('delivery-statuses', () => {
  it('allows the forward happy path and fail/cancel branches', () => {
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.PLANNED,
        DELIVERY_STATUS.IN_TRANSIT,
      ),
    ).not.toThrow();
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.IN_TRANSIT,
        DELIVERY_STATUS.DELIVERED,
      ),
    ).not.toThrow();
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.PLANNED,
        DELIVERY_STATUS.CANCELLED,
      ),
    ).not.toThrow();
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.PLANNED,
        DELIVERY_STATUS.FAILED,
      ),
    ).not.toThrow();
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.IN_TRANSIT,
        DELIVERY_STATUS.FAILED,
      ),
    ).not.toThrow();
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.IN_TRANSIT,
        DELIVERY_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse, skip and terminal transitions', () => {
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.IN_TRANSIT,
        DELIVERY_STATUS.PLANNED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.PLANNED,
        DELIVERY_STATUS.DELIVERED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.DELIVERED,
        DELIVERY_STATUS.CANCELLED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.FAILED,
        DELIVERY_STATUS.IN_TRANSIT,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.CANCELLED,
        DELIVERY_STATUS.PLANNED,
      ),
    ).toThrow(/Invalid status transition/);
  });

  it('rejects same-status transitions', () => {
    expect(() =>
      assertDeliveryTransition(
        DELIVERY_STATUS.PLANNED,
        DELIVERY_STATUS.PLANNED,
      ),
    ).toThrow(/already "planned"/);
  });
});

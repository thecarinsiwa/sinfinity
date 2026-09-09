import {
  assertShipmentTransition,
  SHIPMENT_STATUS,
} from './shipment-statuses';

describe('shipment-statuses', () => {
  it('allows the forward happy path and cancel branches', () => {
    expect(() =>
      assertShipmentTransition(
        SHIPMENT_STATUS.BOOKED,
        SHIPMENT_STATUS.IN_TRANSIT,
      ),
    ).not.toThrow();
    expect(() =>
      assertShipmentTransition(
        SHIPMENT_STATUS.IN_TRANSIT,
        SHIPMENT_STATUS.ARRIVED,
      ),
    ).not.toThrow();
    expect(() =>
      assertShipmentTransition(
        SHIPMENT_STATUS.ARRIVED,
        SHIPMENT_STATUS.CLEARED,
      ),
    ).not.toThrow();
    expect(() =>
      assertShipmentTransition(
        SHIPMENT_STATUS.CLEARED,
        SHIPMENT_STATUS.DELIVERED,
      ),
    ).not.toThrow();
    expect(() =>
      assertShipmentTransition(
        SHIPMENT_STATUS.BOOKED,
        SHIPMENT_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse, skip, and terminal transitions', () => {
    expect(() =>
      assertShipmentTransition(
        SHIPMENT_STATUS.IN_TRANSIT,
        SHIPMENT_STATUS.BOOKED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertShipmentTransition(
        SHIPMENT_STATUS.BOOKED,
        SHIPMENT_STATUS.ARRIVED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertShipmentTransition(
        SHIPMENT_STATUS.DELIVERED,
        SHIPMENT_STATUS.CANCELLED,
      ),
    ).toThrow(/Invalid status transition/);
  });
});

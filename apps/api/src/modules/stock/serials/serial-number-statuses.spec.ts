import {
  assertSerialNumberTransition,
  SERIAL_NUMBER_STATUS,
} from './serial-number-statuses';

describe('serial-number-statuses', () => {
  it('allows the forward happy path', () => {
    expect(() =>
      assertSerialNumberTransition(
        SERIAL_NUMBER_STATUS.IN_STOCK,
        SERIAL_NUMBER_STATUS.RESERVED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSerialNumberTransition(
        SERIAL_NUMBER_STATUS.RESERVED,
        SERIAL_NUMBER_STATUS.SHIPPED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSerialNumberTransition(
        SERIAL_NUMBER_STATUS.SHIPPED,
        SERIAL_NUMBER_STATUS.INSTALLED,
      ),
    ).not.toThrow();
  });

  it('allows returned and scrapped branches', () => {
    expect(() =>
      assertSerialNumberTransition(
        SERIAL_NUMBER_STATUS.IN_STOCK,
        SERIAL_NUMBER_STATUS.SCRAPPED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSerialNumberTransition(
        SERIAL_NUMBER_STATUS.SHIPPED,
        SERIAL_NUMBER_STATUS.RETURNED,
      ),
    ).not.toThrow();
    expect(() =>
      assertSerialNumberTransition(
        SERIAL_NUMBER_STATUS.RETURNED,
        SERIAL_NUMBER_STATUS.IN_STOCK,
      ),
    ).not.toThrow();
  });

  it('rejects reverse and terminal transitions', () => {
    expect(() =>
      assertSerialNumberTransition(
        SERIAL_NUMBER_STATUS.INSTALLED,
        SERIAL_NUMBER_STATUS.SHIPPED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertSerialNumberTransition(
        SERIAL_NUMBER_STATUS.SCRAPPED,
        SERIAL_NUMBER_STATUS.IN_STOCK,
      ),
    ).toThrow(/Invalid status transition/);
  });
});

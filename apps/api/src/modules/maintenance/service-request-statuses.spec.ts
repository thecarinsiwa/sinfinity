import {
  assertServiceRequestTransition,
  SERVICE_REQUEST_STATUS,
} from './service-request-statuses';

describe('service-request-statuses', () => {
  it('allows convert path new → completed and cancel', () => {
    expect(() =>
      assertServiceRequestTransition(
        SERVICE_REQUEST_STATUS.NEW,
        SERVICE_REQUEST_STATUS.COMPLETED,
      ),
    ).not.toThrow();
    expect(() =>
      assertServiceRequestTransition(
        SERVICE_REQUEST_STATUS.NEW,
        SERVICE_REQUEST_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse transitions', () => {
    expect(() =>
      assertServiceRequestTransition(
        SERVICE_REQUEST_STATUS.COMPLETED,
        SERVICE_REQUEST_STATUS.NEW,
      ),
    ).toThrow(/Invalid status transition/);
  });
});

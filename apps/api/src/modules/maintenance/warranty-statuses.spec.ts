import { assertWarrantyTransition, WARRANTY_STATUS } from './warranty-statuses';

describe('warranty-statuses', () => {
  it('allows active → expired and active → void', () => {
    expect(() =>
      assertWarrantyTransition(WARRANTY_STATUS.ACTIVE, WARRANTY_STATUS.EXPIRED),
    ).not.toThrow();
    expect(() =>
      assertWarrantyTransition(WARRANTY_STATUS.ACTIVE, WARRANTY_STATUS.VOID),
    ).not.toThrow();
  });

  it('rejects reverse transitions', () => {
    expect(() =>
      assertWarrantyTransition(WARRANTY_STATUS.EXPIRED, WARRANTY_STATUS.ACTIVE),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertWarrantyTransition(WARRANTY_STATUS.VOID, WARRANTY_STATUS.ACTIVE),
    ).toThrow(/Invalid status transition/);
  });
});

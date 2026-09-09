import { assertContractTransition, CONTRACT_STATUS } from './contract-statuses';

describe('contract-statuses', () => {
  it('allows draft → active → expired and cancel branches', () => {
    expect(() =>
      assertContractTransition(CONTRACT_STATUS.DRAFT, CONTRACT_STATUS.ACTIVE),
    ).not.toThrow();
    expect(() =>
      assertContractTransition(CONTRACT_STATUS.ACTIVE, CONTRACT_STATUS.EXPIRED),
    ).not.toThrow();
    expect(() =>
      assertContractTransition(
        CONTRACT_STATUS.DRAFT,
        CONTRACT_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse transitions', () => {
    expect(() =>
      assertContractTransition(CONTRACT_STATUS.ACTIVE, CONTRACT_STATUS.DRAFT),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertContractTransition(CONTRACT_STATUS.EXPIRED, CONTRACT_STATUS.ACTIVE),
    ).toThrow(/Invalid status transition/);
  });
});

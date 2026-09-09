import {
  assertInstallationTransition,
  INSTALLATION_STATUS,
} from './installation-statuses';

describe('installation-statuses', () => {
  it('allows the happy path and fail branches', () => {
    expect(() =>
      assertInstallationTransition(
        INSTALLATION_STATUS.PLANNED,
        INSTALLATION_STATUS.ONGOING,
      ),
    ).not.toThrow();
    expect(() =>
      assertInstallationTransition(
        INSTALLATION_STATUS.ONGOING,
        INSTALLATION_STATUS.COMPLETED,
      ),
    ).not.toThrow();
    expect(() =>
      assertInstallationTransition(
        INSTALLATION_STATUS.PLANNED,
        INSTALLATION_STATUS.FAILED,
      ),
    ).not.toThrow();
    expect(() =>
      assertInstallationTransition(
        INSTALLATION_STATUS.ONGOING,
        INSTALLATION_STATUS.FAILED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse and terminal transitions', () => {
    expect(() =>
      assertInstallationTransition(
        INSTALLATION_STATUS.ONGOING,
        INSTALLATION_STATUS.PLANNED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertInstallationTransition(
        INSTALLATION_STATUS.COMPLETED,
        INSTALLATION_STATUS.FAILED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertInstallationTransition(
        INSTALLATION_STATUS.FAILED,
        INSTALLATION_STATUS.ONGOING,
      ),
    ).toThrow(/Invalid status transition/);
  });
});

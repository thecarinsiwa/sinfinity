import { assertProjectTransition, PROJECT_STATUS } from './project-statuses';

describe('project-statuses', () => {
  it('allows the forward happy path and hold/cancel branches', () => {
    expect(() =>
      assertProjectTransition(
        PROJECT_STATUS.PLANNED,
        PROJECT_STATUS.IN_PROGRESS,
      ),
    ).not.toThrow();
    expect(() =>
      assertProjectTransition(
        PROJECT_STATUS.IN_PROGRESS,
        PROJECT_STATUS.COMPLETED,
      ),
    ).not.toThrow();
    expect(() =>
      assertProjectTransition(
        PROJECT_STATUS.IN_PROGRESS,
        PROJECT_STATUS.ON_HOLD,
      ),
    ).not.toThrow();
    expect(() =>
      assertProjectTransition(
        PROJECT_STATUS.ON_HOLD,
        PROJECT_STATUS.IN_PROGRESS,
      ),
    ).not.toThrow();
    expect(() =>
      assertProjectTransition(PROJECT_STATUS.PLANNED, PROJECT_STATUS.CANCELLED),
    ).not.toThrow();
  });

  it('rejects reverse and terminal transitions', () => {
    expect(() =>
      assertProjectTransition(
        PROJECT_STATUS.IN_PROGRESS,
        PROJECT_STATUS.PLANNED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertProjectTransition(
        PROJECT_STATUS.COMPLETED,
        PROJECT_STATUS.CANCELLED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertProjectTransition(PROJECT_STATUS.CANCELLED, PROJECT_STATUS.PLANNED),
    ).toThrow(/Invalid status transition/);
  });
});

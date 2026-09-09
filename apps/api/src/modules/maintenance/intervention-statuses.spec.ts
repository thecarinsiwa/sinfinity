import {
  assertInterventionTransition,
  INTERVENTION_STATUS,
} from './intervention-statuses';

describe('intervention-statuses', () => {
  it('allows planned → done and planned → cancelled', () => {
    expect(() =>
      assertInterventionTransition(
        INTERVENTION_STATUS.PLANNED,
        INTERVENTION_STATUS.DONE,
      ),
    ).not.toThrow();
    expect(() =>
      assertInterventionTransition(
        INTERVENTION_STATUS.PLANNED,
        INTERVENTION_STATUS.CANCELLED,
      ),
    ).not.toThrow();
  });

  it('rejects reverse and terminal transitions', () => {
    expect(() =>
      assertInterventionTransition(
        INTERVENTION_STATUS.DONE,
        INTERVENTION_STATUS.PLANNED,
      ),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertInterventionTransition(
        INTERVENTION_STATUS.CANCELLED,
        INTERVENTION_STATUS.DONE,
      ),
    ).toThrow(/Invalid status transition/);
  });
});

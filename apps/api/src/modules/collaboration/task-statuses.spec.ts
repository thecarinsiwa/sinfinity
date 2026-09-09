import {
  assertTaskTransition,
  TASK_STATUS,
} from './task-statuses';

describe('task-statuses', () => {
  it('allows todo → in_progress → done', () => {
    expect(() =>
      assertTaskTransition(TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS),
    ).not.toThrow();
    expect(() =>
      assertTaskTransition(TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE),
    ).not.toThrow();
  });

  it('rejects done → todo', () => {
    expect(() =>
      assertTaskTransition(TASK_STATUS.DONE, TASK_STATUS.TODO),
    ).toThrow(/Invalid status transition/);
  });
});

import {
  assertTaskTransition,
  TASK_STATUS,
  TASK_STATUS_TRANSITIONS,
} from './task-statuses';

describe('task-statuses (transitions)', () => {
  it('allows todo → in_progress → done', () => {
    expect(() =>
      assertTaskTransition(TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS),
    ).not.toThrow();
    expect(() =>
      assertTaskTransition(TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE),
    ).not.toThrow();
  });

  it('allows cancel from todo and in_progress', () => {
    expect(() =>
      assertTaskTransition(TASK_STATUS.TODO, TASK_STATUS.CANCELLED),
    ).not.toThrow();
    expect(() =>
      assertTaskTransition(TASK_STATUS.IN_PROGRESS, TASK_STATUS.CANCELLED),
    ).not.toThrow();
  });

  it('allows in_progress → todo (reopen)', () => {
    expect(() =>
      assertTaskTransition(TASK_STATUS.IN_PROGRESS, TASK_STATUS.TODO),
    ).not.toThrow();
  });

  it('rejects done → todo and same-status', () => {
    expect(() =>
      assertTaskTransition(TASK_STATUS.DONE, TASK_STATUS.TODO),
    ).toThrow(/Invalid status transition/);
    expect(() =>
      assertTaskTransition(TASK_STATUS.TODO, TASK_STATUS.TODO),
    ).toThrow(/already/);
  });

  it('exposes a complete forward map', () => {
    expect(TASK_STATUS_TRANSITIONS.todo).toEqual(['in_progress', 'cancelled']);
    expect(TASK_STATUS_TRANSITIONS.done).toEqual([]);
    expect(TASK_STATUS_TRANSITIONS.cancelled).toEqual([]);
  });
});

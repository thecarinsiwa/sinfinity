import { BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  };
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.orderBy = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.offset = jest.fn(self);
  chain.$dynamic = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('TasksService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const userId = '0191e6b8-4c3a-7b2d-9f1e-useruseruseru';
  const taskId = '0191e6b8-4c3a-7b2d-9f1e-tasktasktaskta';

  const todoRow = {
    id: taskId,
    organization_id: orgId,
    title: 'Follow up',
    description: null,
    assignee_id: userId,
    created_by: userId,
    priority: 'medium',
    status: 'todo',
    due_at: null,
    entity_type: null,
    entity_id: null,
    completed_at: null,
    created_at: '2026-04-01',
    updated_at: '2026-04-01',
    deleted_at: null,
  };

  let service: TasksService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new TasksService(db as never);
  });

  it('transitions todo → in_progress → done and sets completedAt', async () => {
    db.select
      .mockReturnValueOnce(thenable([todoRow]))
      .mockReturnValueOnce(
        thenable([{ ...todoRow, status: 'in_progress' }]),
      );

    const mid = await service.transition(
      taskId,
      { toStatus: 'in_progress' },
      orgId,
    );
    expect(mid.status).toBe('in_progress');

    db.select
      .mockReturnValueOnce(
        thenable([{ ...todoRow, status: 'in_progress' }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            ...todoRow,
            status: 'done',
            completed_at: '2026-04-02 10:00:00.000',
          },
        ]),
      );

    const done = await service.transition(
      taskId,
      { toStatus: 'done' },
      orgId,
    );
    expect(done.status).toBe('done');
    expect(done.completedAt).toBeTruthy();
  });

  it('rejects illegal transition', async () => {
    db.select.mockReturnValueOnce(thenable([todoRow]));

    await expect(
      service.transition(taskId, { toStatus: 'done' }, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transitions todo → cancelled', async () => {
    db.select
      .mockReturnValueOnce(thenable([todoRow]))
      .mockReturnValueOnce(
        thenable([{ ...todoRow, status: 'cancelled' }]),
      );

    const result = await service.transition(
      taskId,
      { toStatus: 'cancelled' },
      orgId,
    );
    expect(result.status).toBe('cancelled');
  });

  it('rejects entityType without entityId', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));

    await expect(
      service.create(
        {
          organizationId: orgId,
          title: 'Broken link',
          entityType: 'sales_order',
        },
        orgId,
      ),
    ).rejects.toThrow(/entityType and entityId must be provided together/);
  });

  it('findMyTasks requires authenticated user', async () => {
    await expect(
      service.findMyTasks({ page: 1, pageSize: 20 } as never, orgId, undefined),
    ).rejects.toThrow(/Authenticated user is required/);
  });
});

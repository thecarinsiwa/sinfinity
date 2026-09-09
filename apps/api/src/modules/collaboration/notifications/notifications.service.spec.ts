import { NotificationsService } from './notifications.service';

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

describe('NotificationsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const userId = '0191e6b8-4c3a-7b2d-9f1e-useruseruseru';
  const notifId = '0191e6b8-4c3a-7b2d-9f1e-notifnotifnotif';

  const authUser = {
    id: userId,
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const unreadRow = {
    id: notifId,
    organization_id: orgId,
    user_id: userId,
    channel: 'in_app',
    title: 'Ticket assigned',
    body: 'You were assigned',
    entity_type: 'ticket',
    entity_id: 't1',
    is_read: 0,
    sent_at: '2026-04-01 10:00:00.000',
    read_at: null,
  };

  let service: NotificationsService;
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
    service = new NotificationsService(db as never);
  });

  it('notify in_app inserts a row', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: userId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([{ ...unreadRow }]));

    const result = await service.notify({
      organizationId: orgId,
      userId,
      title: 'Ticket assigned',
      body: 'You were assigned',
      entityType: 'ticket',
      entityId: 't1',
    });

    expect(result?.channel).toBe('in_app');
    expect(result?.isRead).toBe(false);
    expect(db.insert).toHaveBeenCalled();
  });

  it('notify email is a no-op', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: userId, organization_id: orgId }]),
      );

    const result = await service.notify({
      organizationId: orgId,
      userId,
      channel: 'email',
      title: 'Hello',
    });

    expect(result).toBeNull();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('markRead sets is_read', async () => {
    db.select
      .mockReturnValueOnce(thenable([unreadRow]))
      .mockReturnValueOnce(
        thenable([
          {
            ...unreadRow,
            is_read: 1,
            read_at: '2026-04-01 11:00:00.000',
          },
        ]),
      );

    const result = await service.markRead(notifId, orgId, authUser as never);
    expect(result.isRead).toBe(true);
    expect(db.update).toHaveBeenCalled();
  });

  it('findAll requires authenticated user', async () => {
    await expect(
      service.findAll({ page: 1, pageSize: 20 } as never, orgId, undefined),
    ).rejects.toThrow(/Authenticated user is required/);
  });
});

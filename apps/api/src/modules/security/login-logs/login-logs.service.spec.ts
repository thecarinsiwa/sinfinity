import { LoginLogsService } from './login-logs.service';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  } as Thenable<T>;
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.orderBy = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.offset = jest.fn(self);
  chain.$dynamic = jest.fn(self);
  return chain;
}

describe('LoginLogsService', () => {
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-loginlog0001',
    user_id: 'user-1',
    email_attempted: 'admin@sinfinity.cd',
    success: 1,
    failure_reason: null,
    ip_address: '127.0.0.1',
    user_agent: 'jest',
    created_at: '2026-09-10 12:00:00.000',
  };

  const failRow = {
    ...row,
    id: '0191e6b8-4c3a-7b2d-9f1e-loginlog0002',
    success: 0,
    failure_reason: 'invalid_password',
  };

  let service: LoginLogsService;
  let db: { select: jest.Mock };

  beforeEach(() => {
    db = { select: jest.fn() };
    service = new LoginLogsService(db as never);
  });

  it('lists login logs and maps success tinyint to boolean', async () => {
    db.select
      .mockReturnValueOnce(thenable([row, failRow]))
      .mockReturnValueOnce(thenable([{ total: 2 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      order: 'asc',
    });

    expect(result.meta.total).toBe(2);
    expect(result.data[0].success).toBe(true);
    expect(result.data[0].emailAttempted).toBe('admin@sinfinity.cd');
    expect(result.data[1].success).toBe(false);
    expect(result.data[1].failureReason).toBe('invalid_password');
  });

  it('applies email and success filters without throwing', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      order: 'asc',
      email: 'admin@',
      success: true,
      dateFrom: '2026-09-01',
      dateTo: '2026-09-30',
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].userId).toBe('user-1');
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it('filters failures via success=false', async () => {
    db.select
      .mockReturnValueOnce(thenable([failRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 10,
      order: 'desc',
      success: false,
      userId: 'user-1',
    });

    expect(result.data[0].success).toBe(false);
    expect(result.meta.pageSize).toBe(10);
  });
});

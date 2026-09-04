import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';

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
  chain.values = jest.fn(self);
  return chain;
}

describe('AuditService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-auditlog0001',
    organization_id: orgId,
    user_id: 'user-1',
    action: 'create',
    entity_type: 'users',
    entity_id: 'user-2',
    old_values: null,
    new_values: { email: 'a@b.co' },
    ip_address: '127.0.0.1',
    created_at: '2026-09-04 12:00:00.000',
  };

  let service: AuditService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new AuditService(db as never);
  });

  it('writes an audit log row', async () => {
    await service.write({
      organizationId: orgId,
      userId: 'user-1',
      action: 'create',
      entityType: 'users',
      entityId: 'user-2',
      newValues: { email: 'a@b.co' },
      ipAddress: '127.0.0.1',
    });

    expect(db.insert).toHaveBeenCalled();
  });

  it('swallows write errors', async () => {
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue(new Error('db down')),
    });

    await expect(
      service.write({
        action: 'create',
        entityType: 'users',
      }),
    ).resolves.toBeUndefined();
  });

  it('lists audit logs scoped to organization', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      orgId,
      { id: 'u1', organizationId: orgId, isSuperAdmin: false },
    );

    expect(result.data[0].entityType).toBe('users');
    expect(result.data[0].action).toBe('create');
  });

  it('requires organization scope for non super-admin', async () => {
    await expect(
      service.findAll(
        { page: 1, pageSize: 20, order: 'asc' },
        undefined,
        { id: 'u1', organizationId: '', isSuperAdmin: false },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forbids cross-org query for org users', async () => {
    await expect(
      service.findAll(
        {
          page: 1,
          pageSize: 20,
          order: 'asc',
          organizationId: 'other-org',
        },
        orgId,
        { id: 'u1', organizationId: orgId, isSuperAdmin: false },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

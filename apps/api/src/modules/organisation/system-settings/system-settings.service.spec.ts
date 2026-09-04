import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';

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
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('SystemSettingsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-settingsetting',
    organization_id: orgId,
    key: 'default_currency',
    value: { code: 'USD' },
    description: 'Default currency' as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: SystemSettingsService;
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
    service = new SystemSettingsService(db as never);
  });

  it('lists settings for the organization', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      orgId,
      orgUser,
    );

    expect(result.data[0].key).toBe('default_currency');
    expect(result.data[0].value).toEqual({ code: 'USD' });
  });

  it('requires organizationId', async () => {
    await expect(
      service.findAll({ page: 1, pageSize: 20, order: 'asc' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('gets a setting by key', async () => {
    db.select.mockReturnValue(thenable([row]));

    const result = await service.findByKey(
      'default_currency',
      orgId,
      orgUser,
    );

    expect(result.key).toBe('default_currency');
  });

  it('returns 404 when key is missing', async () => {
    db.select.mockReturnValue(thenable([]));

    await expect(
      service.findByKey('missing', orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a setting when key does not exist', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([row]));

    const created = await service.upsertByKey(
      'default_currency',
      { value: { code: 'USD' }, description: 'Default currency' },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(created.key).toBe('default_currency');
  });

  it('updates a setting when key exists', async () => {
    const updated = { ...row, value: { code: 'EUR' } };
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([updated]));

    const result = await service.upsertByKey(
      'default_currency',
      { value: { code: 'EUR' } },
      orgId,
      orgUser,
    );

    expect(db.update).toHaveBeenCalled();
    expect(result.value).toEqual({ code: 'EUR' });
  });

  it('forbids cross-org access', async () => {
    await expect(
      service.findByKey('default_currency', orgId, orgUser, 'other-org'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('bulk upserts settings', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([row]));

    const results = await service.bulkUpsert(
      [{ key: 'default_currency', value: { code: 'USD' } }],
      orgId,
      orgUser,
    );

    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('default_currency');
  });
});

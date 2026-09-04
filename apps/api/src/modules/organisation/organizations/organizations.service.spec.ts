import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

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

describe('OrganizationsService', () => {
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg',
    name: 'Sinfinity SARL',
    legal_name: 'Sinfinity SARL',
    tax_id: 'A123',
    email: 'contact@sinfinity.cd',
    phone: null as string | null,
    website: null as string | null,
    logo_url: null as string | null,
    default_currency_id: null as string | null,
    country_id: null as string | null,
    is_active: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  const superAdmin = {
    id: 'user-sa',
    organizationId: row.id,
    isSuperAdmin: true,
    permissions: ['organizations.write'],
  };

  const orgUser = {
    id: 'user-1',
    organizationId: row.id,
    isSuperAdmin: false,
    permissions: ['organizations.read'],
  };

  let service: OrganizationsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };
    service = new OrganizationsService(db as never);
  });

  it('lists organizations', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      superAdmin,
    );

    expect(result.data[0].name).toBe('Sinfinity SARL');
    expect(result.data[0].legalName).toBe('Sinfinity SARL');
  });

  it('forbids create without super-admin', async () => {
    await expect(
      service.create({ name: 'X' }, orgUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates when super-admin', async () => {
    db.insert.mockReturnValue(thenable(undefined));
    db.select.mockReturnValue(thenable([row]));

    const created = await service.create({ name: 'Sinfinity SARL' }, superAdmin);
    expect(created.name).toBe('Sinfinity SARL');
  });

  it('forbids access to another organization', async () => {
    db.select.mockReturnValue(thenable([row]));

    await expect(
      service.findOne(row.id, {
        id: 'u2',
        organizationId: 'other-org',
        isSuperAdmin: false,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('soft-deletes an organization', async () => {
    db.select.mockReturnValue(thenable([row]));
    db.update.mockReturnValue(thenable(undefined));

    await service.remove(row.id, superAdmin);
    expect(db.update).toHaveBeenCalled();
  });

  it('throws when missing', async () => {
    db.select.mockReturnValue(thenable([]));
    await expect(service.findOne(row.id, superAdmin)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

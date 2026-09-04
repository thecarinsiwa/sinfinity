import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

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

describe('SuppliersService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const supplierId = '0191e6b8-4c3a-7b2d-9f1e-supsupsupsup';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const supplierRow = {
    id: supplierId,
    organization_id: orgId,
    code: 'SUP-CN-001',
    name: 'Shenzhen Tech',
    category_id: null as string | null,
    country_id: null as string | null,
    email: 'sales@sz.tech',
    phone: null as string | null,
    website: null as string | null,
    tax_id: null as string | null,
    rating: '4.50',
    status: 'active' as const,
    preferred: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: SuppliersService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new SuppliersService(db as never);
  });

  it('creates a supplier and returns nested collections', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([supplierRow]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.create(
      {
        code: 'sup-cn-001',
        name: 'Shenzhen Tech',
        preferred: true,
        contacts: [{ firstName: 'Wei', lastName: 'Zhang', isPrimary: true }],
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(result.code).toBe('SUP-CN-001');
    expect(result.preferred).toBe(true);
    expect(result.contacts).toEqual([]);
  });

  it('maps duplicate code to ConflictException', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ code: 'X', name: 'Y' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists suppliers for org', async () => {
    db.select
      .mockReturnValueOnce(thenable([supplierRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20 },
      orgId,
      orgUser,
    );
    expect(result.data[0].code).toBe('SUP-CN-001');
    expect(result.data[0].contacts).toBeUndefined();
  });

  it('throws when supplier is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.findOne(supplierId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

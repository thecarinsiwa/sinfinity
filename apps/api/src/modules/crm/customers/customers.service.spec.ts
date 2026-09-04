import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';

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

describe('CustomersService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcust';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const customerRow = {
    id: customerId,
    organization_id: orgId,
    category_id: null as string | null,
    code: 'CUST-001',
    type: 'organization' as const,
    name: 'Acme SA',
    legal_name: null as string | null,
    tax_id: null as string | null,
    email: 'hello@acme.test',
    phone: null as string | null,
    website: null as string | null,
    owner_user_id: null as string | null,
    status: 'active' as const,
    converted_from_lead_id: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: CustomersService;
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
    service = new CustomersService(db as never);
  });

  it('creates a customer and returns nested collections', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([customerRow]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.create(
      {
        code: 'cust-001',
        name: 'Acme SA',
        contacts: [{ firstName: 'Jane', lastName: 'Doe', isPrimary: true }],
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(result.code).toBe('CUST-001');
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

  it('lists customers for org', async () => {
    db.select
      .mockReturnValueOnce(thenable([customerRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20 },
      orgId,
      orgUser,
    );
    expect(result.data[0].code).toBe('CUST-001');
    expect(result.data[0].contacts).toBeUndefined();
  });

  it('throws when customer is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.findOne(customerId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('clears other primaries when adding a primary contact', async () => {
    db.select
      .mockReturnValueOnce(thenable([customerRow]))
      .mockReturnValueOnce(
        thenable([
          {
            id: '0191e6b8-4c3a-7b2d-9f1e-contcontcont',
            customer_id: customerId,
            first_name: 'Jane',
            last_name: 'Doe',
            title: null,
            email: null,
            phone: null,
            is_primary: 1,
            is_decision_maker: 0,
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
            deleted_at: null,
          },
        ]),
      );

    await service.addContact(
      customerId,
      { firstName: 'John', lastName: 'Smith', isPrimary: true },
      orgId,
      orgUser,
    );

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });
});

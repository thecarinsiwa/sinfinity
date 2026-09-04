import { ConflictException } from '@nestjs/common';
import { ServicesService } from './services.service';

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

describe('ServicesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-svcsvcsvcsvc',
    organization_id: orgId,
    code: 'INST-SW',
    name: 'Switch installation',
    description: null as string | null,
    category_id: null as string | null,
    base_price: '150.0000',
    currency_id: null as string | null,
    billing_type: 'fixed' as const,
    is_active: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: ServicesService;
  let db: { select: jest.Mock; insert: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new ServicesService(db as never);
  });

  it('creates a fixed billing service', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([row]));

    const result = await service.create(
      {
        code: 'inst-sw',
        name: 'Switch installation',
        basePrice: '150.0000',
        billingType: 'fixed',
      },
      orgId,
      orgUser,
    );

    expect(result.code).toBe('INST-SW');
    expect(result.billingType).toBe('fixed');
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
});

import { ConflictException } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';

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

describe('PaymentMethodsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const methodId = '0191e6b8-4c3a-7b2d-9f1e-methmethmethme';

  let service: PaymentMethodsService;
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
    service = new PaymentMethodsService(db as never);
  });

  it('creates method with uppercase code', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: methodId,
            organization_id: orgId,
            code: 'MOBILE_MONEY',
            name: 'Mobile Money',
            is_active: 1,
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        ]),
      );

    const result = await service.create(
      {
        organizationId: orgId,
        code: 'mobile_money',
        name: 'Mobile Money',
      },
      orgId,
    );

    expect(result.code).toBe('MOBILE_MONEY');
    expect(db.insert).toHaveBeenCalled();
  });

  it('rejects duplicate code', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValueOnce({
      values: jest
        .fn()
        .mockRejectedValue(Object.assign(new Error('dup'), { errno: 1062 })),
    });

    await expect(
      service.create(
        {
          organizationId: orgId,
          code: 'CASH',
          name: 'Cash',
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates on remove', async () => {
    db.select.mockReturnValueOnce(
      thenable([
        {
          id: methodId,
          organization_id: orgId,
          code: 'CASH',
          name: 'Cash',
          is_active: 1,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      ]),
    );

    await service.remove(methodId, orgId);
    expect(db.update).toHaveBeenCalled();
  });
});

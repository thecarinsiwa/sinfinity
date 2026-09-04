import { NotFoundException } from '@nestjs/common';
import { SupplierHistoriesService } from './supplier-histories.service';

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
  chain.innerJoin = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('SupplierHistoriesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const supplierId = '0191e6b8-4c3a-7b2d-9f1e-supsupsupsup';
  const historyId = '0191e6b8-4c3a-7b2d-9f1e-histhisthist';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const historyRow = {
    id: historyId,
    supplier_id: supplierId,
    event_type: 'payment',
    entity_type: null as string | null,
    entity_id: null as string | null,
    summary: 'Wire transfer received',
    amount: '1500.0000',
    currency_id: null as string | null,
    occurred_at: '2026-09-04 10:00:00.000',
  };

  let service: SupplierHistoriesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new SupplierHistoriesService(db as never);
  });

  it('appends a history event', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: supplierId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([historyRow]));

    const result = await service.create(
      {
        supplierId,
        eventType: 'payment',
        summary: 'Wire transfer received',
        amount: '1500.0000',
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.eventType).toBe('payment');
    expect(result.amount).toBe('1500.0000');
  });

  it('lists histories for a supplier', async () => {
    db.select
      .mockReturnValueOnce(thenable([historyRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc', supplierId },
      orgId,
      orgUser,
    );

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('throws when supplier is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.create(
        { supplierId, eventType: 'quote' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

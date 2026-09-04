import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { resolveLineTotal } from './opportunities.mapper';

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

describe('OpportunitiesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcust';
  const opportunityId = '0191e6b8-4c3a-7b2d-9f1e-oppoppoppopp';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const opportunityRow = {
    id: opportunityId,
    organization_id: orgId,
    customer_id: customerId,
    lead_id: null as string | null,
    name: 'Firewall refresh',
    stage: 'qualification' as const,
    probability: 20,
    expected_close_date: null as string | null,
    amount: '2500.0000',
    currency_id: null as string | null,
    owner_user_id: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  const itemRow = {
    id: '0191e6b8-4c3a-7b2d-9f1e-itemitemitem',
    opportunity_id: opportunityId,
    product_id: null as string | null,
    service_id: null as string | null,
    description: 'Switch',
    quantity: '2.0000',
    unit_price: '1250.0000',
    line_total: '2500.0000',
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: OpportunitiesService;
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
    service = new OpportunitiesService(db as never);
  });

  it('computes line total when omitted', () => {
    expect(resolveLineTotal('2.0000', '1250.0000')).toBe('2500.0000');
  });

  it('creates an opportunity with nested items and sums amount', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([{ id: customerId }]))
      .mockReturnValueOnce(thenable([itemRow]))
      .mockReturnValueOnce(thenable([opportunityRow]))
      .mockReturnValueOnce(thenable([itemRow]));

    const result = await service.create(
      {
        customerId,
        name: 'Firewall refresh',
        items: [
          {
            description: 'Switch',
            quantity: '2.0000',
            unitPrice: '1250.0000',
          },
        ],
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(db.update).toHaveBeenCalled();
    expect(result.name).toBe('Firewall refresh');
    expect(result.items?.[0].lineTotal).toBe('2500.0000');
  });

  it('rejects item without product, service or description', async () => {
    db.select.mockReturnValueOnce(thenable([opportunityRow]));

    await expect(
      service.addItem(
        opportunityId,
        { quantity: '1.0000' },
        false,
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recalculates amount after adding an item', async () => {
    db.select
      .mockReturnValueOnce(thenable([opportunityRow]))
      .mockReturnValueOnce(thenable([itemRow]))
      .mockReturnValueOnce(thenable([itemRow]));

    const result = await service.addItem(
      opportunityId,
      {
        description: 'Switch',
        quantity: '2.0000',
        unitPrice: '1250.0000',
      },
      true,
      orgId,
      orgUser,
    );

    expect(db.update).toHaveBeenCalled();
    expect(result.lineTotal).toBe('2500.0000');
  });

  it('throws when opportunity is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.findOne(opportunityId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

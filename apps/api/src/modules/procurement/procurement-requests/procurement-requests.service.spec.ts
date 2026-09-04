import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProcurementRequestsService } from './procurement-requests.service';

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

describe('ProcurementRequestsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const requestId = '0191e6b8-4c3a-7b2d-9f1e-reqreqreqreq';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const requestRow = {
    id: requestId,
    organization_id: orgId,
    request_number: 'PR-2026-001',
    title: '40 switches',
    requested_by: 'user-1',
    opportunity_id: null as string | null,
    sales_order_id: null as string | null,
    needed_by: null as string | null,
    status: 'draft' as const,
    priority: 'medium' as const,
    notes: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: ProcurementRequestsService;
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
    service = new ProcurementRequestsService(db as never);
  });

  it('creates a draft request with default medium priority', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([requestRow]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.create(
      { requestNumber: 'PR-2026-001', title: '40 switches' },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.status).toBe('draft');
    expect(result.priority).toBe('medium');
    expect(result.requestNumber).toBe('PR-2026-001');
  });

  it('maps duplicate request number to ConflictException', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create(
        { requestNumber: 'PR-2026-001', title: 'Dup' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects item without productId or description', async () => {
    db.select.mockReturnValueOnce(thenable([requestRow]));

    await expect(
      service.addItem(requestId, { quantity: '1' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows free-text specification without productId', async () => {
    db.select
      .mockReturnValueOnce(thenable([requestRow]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'item-1',
            procurement_request_id: requestId,
            product_id: null,
            description: '48-port PoE switch',
            quantity: '40.0000',
            unit_id: null,
            target_unit_price: null,
            currency_id: null,
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const item = await service.addItem(
      requestId,
      { description: '48-port PoE switch', quantity: '40' },
      orgId,
      orgUser,
    );

    expect(item.productId).toBeNull();
    expect(item.description).toBe('48-port PoE switch');
  });

  it('rejects item mutations when not draft or open', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...requestRow, status: 'quoted' }]),
    );

    await expect(
      service.addItem(
        requestId,
        { description: 'Line', quantity: '1' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transitions draft to open', async () => {
    db.select
      .mockReturnValueOnce(thenable([requestRow]))
      .mockReturnValueOnce(
        thenable([{ ...requestRow, status: 'open' }]),
      )
      .mockReturnValueOnce(thenable([]));

    const result = await service.transition(
      requestId,
      { toStatus: 'open' },
      orgId,
      orgUser,
    );

    expect(db.update).toHaveBeenCalled();
    expect(result.status).toBe('open');
  });

  it('rejects illegal status transitions', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...requestRow, status: 'open' }]),
    );

    await expect(
      service.transition(
        requestId,
        { toStatus: 'draft' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

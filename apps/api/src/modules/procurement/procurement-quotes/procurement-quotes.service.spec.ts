import { BadRequestException } from '@nestjs/common';
import { ProcurementQuotesService } from './procurement-quotes.service';

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
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('ProcurementQuotesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const requestId = '0191e6b8-4c3a-7b2d-9f1e-reqreqreqreq';
  const quoteId = '0191e6b8-4c3a-7b2d-9f1e-quotequotequot';
  const supplierId = '0191e6b8-4c3a-7b2d-9f1e-supsupsupsup';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const openRequest = {
    id: requestId,
    organization_id: orgId,
    status: 'open' as const,
  };

  const quoteItem = {
    id: 'qi-1',
    procurement_quote_id: quoteId,
    procurement_request_item_id: null as string | null,
    product_id: null as string | null,
    quantity: '2.0000',
    unit_price: '95.0000',
    lead_time_days: null as number | null,
    notes: null as string | null,
    line_total: '190.0000',
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  const quoteRow = {
    id: quoteId,
    procurement_request_id: requestId,
    supplier_id: supplierId,
    quote_number: 'SQ-1',
    quote_date: '2026-09-04',
    valid_until: null as string | null,
    currency_id: null as string | null,
    shipping_term_id: null as string | null,
    lead_time_days: 14,
    status: 'received' as const,
    total_amount: '190.0000',
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: ProcurementQuotesService;
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
    service = new ProcurementQuotesService(db as never);
  });

  it('creates a quote, recalculates total, and bumps open → quoted', async () => {
    db.select
      .mockReturnValueOnce(thenable([openRequest]))
      .mockReturnValueOnce(
        thenable([{ id: supplierId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([quoteItem]))
      .mockReturnValueOnce(thenable([openRequest]))
      .mockReturnValueOnce(thenable([quoteRow]))
      .mockReturnValueOnce(thenable([quoteItem]));

    const result = await service.create(
      requestId,
      {
        supplierId,
        items: [{ quantity: '2', unitPrice: '95' }],
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
    expect(result.totalAmount).toBe('190.0000');
    expect(result.status).toBe('received');
  });

  it('rejects quote creation on draft request', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...openRequest, status: 'draft' }]),
    );

    await expect(
      service.create(requestId, { supplierId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects selecting without shortlisting first', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ ...openRequest, status: 'quoted' }]))
      .mockReturnValueOnce(thenable([quoteRow]));

    await expect(
      service.transition(
        requestId,
        quoteId,
        { toStatus: 'selected' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects request item from another request', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ ...openRequest, status: 'quoted' }]))
      .mockReturnValueOnce(thenable([{ ...quoteRow, status: 'received' }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'ri-other',
            procurement_request_id: 'other-request',
          },
        ]),
      );

    await expect(
      service.addItem(
        requestId,
        quoteId,
        {
          procurementRequestItemId: 'ri-other',
          quantity: '1',
          unitPrice: '10',
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

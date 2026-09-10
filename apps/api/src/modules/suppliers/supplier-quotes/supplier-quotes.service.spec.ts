import { BadRequestException } from '@nestjs/common';
import { SupplierQuotesService } from './supplier-quotes.service';

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
  chain.innerJoin = jest.fn(self);
  return chain;
}

describe('SupplierQuotesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const quoteId = '0191e6b8-4c3a-7b2d-9f1e-quotequotequot';
  const supplierId = '0191e6b8-4c3a-7b2d-9f1e-supsupsupsup';
  const itemId = '0191e6b8-4c3a-7b2d-9f1e-itemitemitemit';

  const draftQuote = {
    id: quoteId,
    organization_id: orgId,
    supplier_id: supplierId,
    quote_number: 'SQ-1',
    quote_date: '2026-09-10',
    valid_until: null as string | null,
    currency_id: null as string | null,
    status: 'draft' as const,
    notes: null as string | null,
    created_at: '2026-09-10 10:00:00.000',
    updated_at: '2026-09-10 10:00:00.000',
    created_by: null as string | null,
    updated_by: null as string | null,
    deleted_at: null as string | null,
  };

  let service: SupplierQuotesService;
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
    service = new SupplierQuotesService(db as never);
  });

  it('transitions draft → received', async () => {
    db.select
      .mockReturnValueOnce(thenable([draftQuote]))
      .mockReturnValueOnce(
        thenable([{ ...draftQuote, status: 'received' }]),
      )
      .mockReturnValueOnce(thenable([]));

    const result = await service.transition(
      quoteId,
      { toStatus: 'received' },
      orgId,
    );
    expect(result.status).toBe('received');
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects illegal transition', async () => {
    db.select.mockReturnValueOnce(thenable([draftQuote]));

    await expect(
      service.transition(quoteId, { toStatus: 'selected' }, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects item update when quote is selected', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...draftQuote, status: 'selected' }]),
    );

    await expect(
      service.updateItem(
        quoteId,
        itemId,
        { quantity: '3.0000' },
        orgId,
      ),
    ).rejects.toThrow(/Cannot modify/);
  });

  it('computes lineTotal on addItem', async () => {
    db.select
      .mockReturnValueOnce(thenable([draftQuote]))
      .mockReturnValueOnce(
        thenable([
          {
            id: itemId,
            supplier_quote_id: quoteId,
            product_id: null,
            description: null,
            quantity: '2.0000',
            unit_price: '95.0000',
            lead_time_days: null,
            line_total: '190.0000',
            created_at: '2026-09-10 10:00:00.000',
            updated_at: '2026-09-10 10:00:00.000',
          },
        ]),
      );

    const item = await service.addItem(
      quoteId,
      { quantity: '2.0000', unitPrice: '95.0000' },
      orgId,
    );

    expect(item.lineTotal).toBe('190.0000');
    expect(db.insert).toHaveBeenCalled();
  });
});

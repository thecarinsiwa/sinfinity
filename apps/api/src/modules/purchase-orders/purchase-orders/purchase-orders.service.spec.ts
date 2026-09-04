import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';

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

describe('PurchaseOrdersService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const supplierId = '0191e6b8-4c3a-7b2d-9f1e-supsupsupsup';
  const orderId = '0191e6b8-4c3a-7b2d-9f1e-popopopopopo';
  const quoteId = '0191e6b8-4c3a-7b2d-9f1e-quotequotequot';
  const requestId = '0191e6b8-4c3a-7b2d-9f1e-reqreqreqreq';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const orderRow = {
    id: orderId,
    organization_id: orgId,
    po_number: 'PO-2026-001',
    supplier_id: supplierId,
    procurement_request_id: null as string | null,
    procurement_quote_id: null as string | null,
    status: 'draft' as const,
    order_date: '2026-09-04',
    expected_date: null as string | null,
    currency_id: null as string | null,
    shipping_term_id: null as string | null,
    payment_term_id: null as string | null,
    subtotal: '0.0000',
    tax_amount: '0.0000',
    total_amount: '0.0000',
    buyer_user_id: 'user-1',
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: PurchaseOrdersService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    transaction: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
      transaction: jest.fn(),
    };
    service = new PurchaseOrdersService(db as never);
  });

  it('creates a draft PO with history', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: supplierId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([orderRow]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.create(
      { poNumber: 'PO-2026-001', supplierId },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('draft');
    expect(result.poNumber).toBe('PO-2026-001');
  });

  it('maps duplicate po number to ConflictException', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: supplierId, organization_id: orgId }]),
      );
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ poNumber: 'PO-2026-001', supplierId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects item mutations when not draft', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...orderRow, status: 'sent' }]),
    );

    await expect(
      service.addItem(
        orderId,
        { description: 'Line', quantity: '1', unitPrice: '10' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates from a selected quote inside a transaction', async () => {
    const tx = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
    };
    db.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) =>
      fn(tx),
    );

    tx.select
      .mockReturnValueOnce(
        thenable([
          {
            id: quoteId,
            procurement_request_id: requestId,
            supplier_id: supplierId,
            currency_id: null,
            shipping_term_id: null,
            status: 'selected',
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: requestId,
            organization_id: orgId,
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'qi-1',
            procurement_quote_id: quoteId,
            procurement_request_item_id: null,
            product_id: null,
            quantity: '2.0000',
            unit_price: '95.0000',
            lead_time_days: null,
            notes: 'Switch',
            line_total: '190.0000',
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const converted = {
      ...orderRow,
      procurement_request_id: requestId,
      procurement_quote_id: quoteId,
      subtotal: '190.0000',
      total_amount: '190.0000',
    };
    db.select
      .mockReturnValueOnce(thenable([converted]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'poi-1',
            purchase_order_id: orderId,
            product_id: null,
            description: 'Switch',
            quantity: '2.0000',
            quantity_received: '0.0000',
            unit_price: '95.0000',
            line_total: '190.0000',
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.createFromQuote(
      { procurementQuoteId: quoteId, poNumber: 'PO-2026-001' },
      orgId,
      orgUser,
    );

    expect(db.transaction).toHaveBeenCalled();
    expect(result.procurementQuoteId).toBe(quoteId);
    expect(result.items?.[0].quantityReceived).toBe('0.0000');
  });

  it('rejects from-quote when quote is not selected', async () => {
    const tx = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
    };
    db.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) =>
      fn(tx),
    );

    tx.select.mockReturnValueOnce(
      thenable([
        {
          id: quoteId,
          procurement_request_id: requestId,
          supplier_id: supplierId,
          currency_id: null,
          shipping_term_id: null,
          status: 'received',
        },
      ]),
    );

    await expect(
      service.createFromQuote(
        { procurementQuoteId: quoteId, poNumber: 'PO-2026-001' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects from-quote when an active PO already links the quote', async () => {
    const tx = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
    };
    db.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) =>
      fn(tx),
    );

    tx.select
      .mockReturnValueOnce(
        thenable([
          {
            id: quoteId,
            procurement_request_id: requestId,
            supplier_id: supplierId,
            currency_id: null,
            shipping_term_id: null,
            status: 'selected',
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: requestId,
            organization_id: orgId,
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([{ id: orderId }]));

    await expect(
      service.createFromQuote(
        { procurementQuoteId: quoteId, poNumber: 'PO-2026-002' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

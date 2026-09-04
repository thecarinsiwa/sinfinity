import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';

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
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('SalesOrdersService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcust';
  const orderId = '0191e6b8-4c3a-7b2d-9f1e-orderorderord';
  const quotationId = '0191e6b8-4c3a-7b2d-9f1e-quotequotequot';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const orderRow = {
    id: orderId,
    organization_id: orgId,
    order_number: 'SO-2026-001',
    customer_id: customerId,
    quotation_id: null as string | null,
    branch_id: null as string | null,
    status: 'pending' as const,
    order_date: '2026-09-04',
    requested_delivery_date: null as string | null,
    currency_id: null as string | null,
    subtotal: '0.0000',
    tax_amount: '0.0000',
    total_amount: '0.0000',
    billing_address_id: null as string | null,
    shipping_address_id: null as string | null,
    owner_user_id: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: SalesOrdersService;
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
    service = new SalesOrdersService(db as never);
  });

  it('creates a pending sales order with history', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([orderRow]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.create(
      { orderNumber: 'SO-2026-001', customerId },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(result.orderNumber).toBe('SO-2026-001');
    expect(result.status).toBe('pending');
  });

  it('maps duplicate order number to ConflictException', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      );
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ orderNumber: 'SO-2026-001', customerId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects item mutations when not pending', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...orderRow, status: 'confirmed' }]),
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

  it('converts an ACCEPTED quotation inside a transaction', async () => {
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
            id: quotationId,
            organization_id: orgId,
            customer_id: customerId,
            currency_id: null,
            subtotal: '100.0000',
            tax_amount: '16.0000',
            total_amount: '116.0000',
            owner_user_id: null,
            status_id: 'status-accepted',
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([{ code: 'ACCEPTED' }]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'qi-1',
            quotation_id: quotationId,
            product_id: null,
            service_id: null,
            description: 'Line',
            quantity: '1.0000',
            unit_price: '100.0000',
            tax_id: null,
            line_total: '100.0000',
            line_number: 1,
          },
        ]),
      );

    const convertedOrder = {
      ...orderRow,
      quotation_id: quotationId,
      subtotal: '100.0000',
      tax_amount: '16.0000',
      total_amount: '116.0000',
    };
    db.select
      .mockReturnValueOnce(thenable([convertedOrder]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'soi-1',
            sales_order_id: orderId,
            product_id: null,
            service_id: null,
            description: 'Line',
            quantity: '1.0000',
            quantity_delivered: '0.0000',
            unit_price: '100.0000',
            tax_id: null,
            line_total: '100.0000',
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    const result = await service.convertFromQuotation(
      quotationId,
      { orderNumber: 'SO-2026-001' },
      orgId,
      orgUser,
    );

    expect(db.transaction).toHaveBeenCalled();
    expect(tx.insert).toHaveBeenCalled();
    expect(result.quotationId).toBe(quotationId);
    expect(result.items?.[0].quantityDelivered).toBe('0.0000');
  });

  it('rejects convert when quotation is not ACCEPTED', async () => {
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
            id: quotationId,
            organization_id: orgId,
            customer_id: customerId,
            currency_id: null,
            subtotal: '0',
            tax_amount: '0',
            total_amount: '0',
            owner_user_id: null,
            status_id: 'status-draft',
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([{ code: 'DRAFT' }]));

    await expect(
      service.convertFromQuotation(
        quotationId,
        { orderNumber: 'SO-2026-001' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects illegal status transitions', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...orderRow, status: 'confirmed' }]),
    );

    await expect(
      service.transition(
        orderId,
        { toStatus: 'pending' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects delivered when quantities are incomplete', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ ...orderRow, status: 'partially_delivered' }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: 'soi-1',
            sales_order_id: orderId,
            product_id: null,
            service_id: null,
            description: 'Line',
            quantity: '10.0000',
            quantity_delivered: '4.0000',
            unit_price: '1.0000',
            tax_id: null,
            line_total: '10.0000',
            created_at: '2026-09-04 10:00:00.000',
            updated_at: '2026-09-04 10:00:00.000',
          },
        ]),
      );

    await expect(
      service.transition(
        orderId,
        { toStatus: 'delivered' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transitions and writes status history', async () => {
    db.select
      .mockReturnValueOnce(thenable([orderRow]))
      .mockReturnValueOnce(
        thenable([{ ...orderRow, status: 'confirmed' }]),
      )
      .mockReturnValueOnce(thenable([]));

    const result = await service.transition(
      orderId,
      { toStatus: 'confirmed', notes: 'Go' },
      orgId,
      orgUser,
    );

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(result.status).toBe('confirmed');
  });

  it('lists status history oldest first', async () => {
    db.select
      .mockReturnValueOnce(thenable([orderRow]))
      .mockReturnValueOnce(
        thenable([
          {
            id: 'h1',
            sales_order_id: orderId,
            from_status: null,
            to_status: 'pending',
            changed_by: 'user-1',
            changed_at: '2026-09-04 10:00:00.000',
            notes: null,
          },
          {
            id: 'h2',
            sales_order_id: orderId,
            from_status: 'pending',
            to_status: 'confirmed',
            changed_by: 'user-1',
            changed_at: '2026-09-04 11:00:00.000',
            notes: 'ok',
          },
        ]),
      );

    const history = await service.listStatusHistory(orderId, orgId, orgUser);
    expect(history).toHaveLength(2);
    expect(history[0].fromStatus).toBeNull();
    expect(history[1].toStatus).toBe('confirmed');
  });
});

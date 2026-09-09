import { BadRequestException, ConflictException } from '@nestjs/common';
import { AccountsLedgerService } from '../ledger/accounts-ledger.service';
import { InvoicesService } from './invoices.service';

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

describe('InvoicesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcustc';
  const soId = '0191e6b8-4c3a-7b2d-9f1e-sososososososo';
  const invoiceId = '0191e6b8-4c3a-7b2d-9f1e-invinvinvinvin';
  const otherCustomerId = '0191e6b8-4c3a-7b2d-9f1e-otherotheroth';

  let service: InvoicesService;
  let ledger: { upsertReceivable: jest.Mock; closeReceivableForCancelledInvoice: jest.Mock };
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
      transaction: jest.fn(async (fn: (tx: typeof db) => Promise<unknown>) =>
        fn(db),
      ),
    };
    ledger = {
      upsertReceivable: jest.fn().mockResolvedValue(undefined),
      closeReceivableForCancelledInvoice: jest.fn().mockResolvedValue(undefined),
    };
    service = new InvoicesService(
      db as never,
      ledger as unknown as AccountsLedgerService,
    );
  });

  it('rejects create when sales order customer does not match', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: soId,
            organization_id: orgId,
            customer_id: otherCustomerId,
          },
        ]),
      );

    await expect(
      service.create(
        {
          organizationId: orgId,
          invoiceNumber: 'INV-1',
          customerId,
          salesOrderId: soId,
          issueDate: '2026-04-01',
        },
        orgId,
      ),
    ).rejects.toThrow(/Sales order customer must match/);
  });

  it('rejects create when invoice number already exists', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      );
    db.transaction.mockImplementationOnce(async () => {
      throw Object.assign(new Error('dup'), { errno: 1062 });
    });

    await expect(
      service.create(
        {
          organizationId: orgId,
          invoiceNumber: 'INV-1',
          customerId,
          issueDate: '2026-04-01',
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('copies sales order lines on from-sales-order', async () => {
    const soItem = {
      id: 'item-so-1',
      sales_order_id: soId,
      product_id: 'prod-1',
      service_id: null,
      description: 'Switch',
      quantity: '2.0000',
      unit_price: '100.0000',
      tax_id: null,
      line_total: '200.0000',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          {
            id: soId,
            organization_id: orgId,
            customer_id: customerId,
            currency_id: 'cur-1',
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([soItem]))
      // ensureCatalogRefsInOrg product
      .mockReturnValueOnce(
        thenable([{ id: 'prod-1', organization_id: orgId }]),
      )
      // recalculateTotals load items + org
      .mockReturnValueOnce(
        thenable([
          {
            id: 'inv-item-1',
            invoice_id: invoiceId,
            product_id: 'prod-1',
            service_id: null,
            description: 'Switch',
            quantity: '2.0000',
            unit_price: '100.0000',
            tax_id: null,
            line_total: '200.0000',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        ]),
      )
      .mockReturnValueOnce(thenable([{ organization_id: orgId }]))
      // findOne
      .mockReturnValueOnce(
        thenable([
          {
            id: invoiceId,
            organization_id: orgId,
            invoice_number: 'INV-SO-1',
            customer_id: customerId,
            sales_order_id: soId,
            issue_date: '2026-04-01',
            due_date: null,
            currency_id: 'cur-1',
            subtotal: '200.0000',
            tax_amount: '0.0000',
            total_amount: '200.0000',
            amount_paid: '0.0000',
            status: 'draft',
            notes: null,
            created_at: '2026-04-01',
            updated_at: '2026-04-01',
            created_by: null,
            updated_by: null,
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: 'inv-item-1',
            invoice_id: invoiceId,
            product_id: 'prod-1',
            service_id: null,
            description: 'Switch',
            quantity: '2.0000',
            unit_price: '100.0000',
            tax_id: null,
            line_total: '200.0000',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        ]),
      );

    const result = await service.createFromSalesOrder(
      {
        organizationId: orgId,
        salesOrderId: soId,
        invoiceNumber: 'INV-SO-1',
        issueDate: '2026-04-01',
      },
      orgId,
    );

    expect(result.salesOrderId).toBe(soId);
    expect(result.items).toHaveLength(1);
    expect(result.items![0].description).toBe('Switch');
    expect(db.insert).toHaveBeenCalled();
  });

  it('rejects issue without items', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([
          {
            id: invoiceId,
            organization_id: orgId,
            invoice_number: 'INV-1',
            customer_id: customerId,
            sales_order_id: null,
            issue_date: '2026-04-01',
            due_date: '2026-04-30',
            currency_id: null,
            subtotal: '0.0000',
            tax_amount: '0.0000',
            total_amount: '0.0000',
            amount_paid: '0.0000',
            status: 'draft',
            notes: null,
            created_at: '2026-04-01',
            updated_at: '2026-04-01',
            created_by: null,
            updated_by: null,
            deleted_at: null,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([]));

    await expect(
      service.issue(invoiceId, {}, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ledger.upsertReceivable).not.toHaveBeenCalled();
  });

  it('issues draft and upserts AR', async () => {
    const draft = {
      id: invoiceId,
      organization_id: orgId,
      invoice_number: 'INV-1',
      customer_id: customerId,
      sales_order_id: null,
      issue_date: '2026-04-01',
      due_date: '2026-04-30',
      currency_id: null,
      subtotal: '100.0000',
      tax_amount: '0.0000',
      total_amount: '100.0000',
      amount_paid: '0.0000',
      status: 'draft',
      notes: null,
      created_at: '2026-04-01',
      updated_at: '2026-04-01',
      created_by: null,
      updated_by: null,
      deleted_at: null,
    };
    const item = {
      id: 'item-1',
      invoice_id: invoiceId,
      product_id: null,
      service_id: null,
      description: 'Line',
      quantity: '1.0000',
      unit_price: '100.0000',
      tax_id: null,
      line_total: '100.0000',
      created_at: '2026-04-01',
      updated_at: '2026-04-01',
    };

    db.select
      .mockReturnValueOnce(thenable([draft]))
      .mockReturnValueOnce(thenable([item]))
      .mockReturnValueOnce(
        thenable([{ ...draft, status: 'issued' }]),
      )
      .mockReturnValueOnce(thenable([item]));

    const result = await service.issue(invoiceId, {}, orgId);

    expect(result.status).toBe('issued');
    expect(ledger.upsertReceivable).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        customerId,
        invoiceId,
        originalAmount: '100.0000',
        dueDate: '2026-04-30',
      }),
      db,
    );
  });

  it('rejects transition draft→issued (must use issue)', async () => {
    db.select.mockReturnValueOnce(
      thenable([
        {
          id: invoiceId,
          organization_id: orgId,
          invoice_number: 'INV-1',
          customer_id: customerId,
          sales_order_id: null,
          issue_date: '2026-04-01',
          due_date: null,
          currency_id: null,
          subtotal: '0.0000',
          tax_amount: '0.0000',
          total_amount: '0.0000',
          amount_paid: '0.0000',
          status: 'draft',
          notes: null,
          created_at: '2026-04-01',
          updated_at: '2026-04-01',
          created_by: null,
          updated_by: null,
          deleted_at: null,
        },
      ]),
    );

    await expect(
      service.transition(invoiceId, { toStatus: 'issued' }, orgId),
    ).rejects.toThrow(/Use POST \/invoices\/:id\/issue/);
  });
});

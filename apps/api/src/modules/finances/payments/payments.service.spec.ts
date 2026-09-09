import { BadRequestException } from '@nestjs/common';
import { AccountsLedgerService } from '../ledger/accounts-ledger.service';
import { PaymentsService } from './payments.service';

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

describe('PaymentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcustc';
  const invoiceId = '0191e6b8-4c3a-7b2d-9f1e-invinvinvinvin';
  const paymentId = '0191e6b8-4c3a-7b2d-9f1e-paypaypaypaypa';
  const soPaymentId = '0191e6b8-4c3a-7b2d-9f1e-sopsopsopsopso';
  const soId = '0191e6b8-4c3a-7b2d-9f1e-sososososososo';

  let service: PaymentsService;
  let ledger: { upsertReceivable: jest.Mock };
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
    ledger = { upsertReceivable: jest.fn().mockResolvedValue(undefined) };
    service = new PaymentsService(
      db as never,
      ledger as unknown as AccountsLedgerService,
    );
  });

  it('confirms payment and updates invoice amount_paid + AR', async () => {
    const pending = {
      id: paymentId,
      organization_id: orgId,
      customer_id: customerId,
      invoice_id: invoiceId,
      payment_method_id: null,
      amount: '40.0000',
      currency_id: null,
      paid_at: '2026-04-15 10:00:00.000',
      reference: 'MM-1',
      status: 'pending',
      created_at: '2026-04-15',
      updated_at: '2026-04-15',
    };
    const invoice = {
      id: invoiceId,
      organization_id: orgId,
      customer_id: customerId,
      total_amount: '100.0000',
      amount_paid: '0.0000',
      status: 'issued',
      due_date: '2026-04-30',
      deleted_at: null,
    };

    db.select
      .mockReturnValueOnce(thenable([pending]))
      .mockReturnValueOnce(thenable([invoice]))
      .mockReturnValueOnce(
        thenable([{ ...pending, status: 'confirmed' }]),
      );

    const result = await service.confirm(paymentId, {}, orgId);

    expect(result.status).toBe('confirmed');
    expect(db.update).toHaveBeenCalled();
    expect(ledger.upsertReceivable).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId,
        originalAmount: '100.0000',
        amountPaid: '40.0000',
      }),
      db,
    );
  });

  it('links sales_order_payment on confirm', async () => {
    const pending = {
      id: paymentId,
      organization_id: orgId,
      customer_id: customerId,
      invoice_id: null,
      payment_method_id: null,
      amount: '50.0000',
      currency_id: null,
      paid_at: '2026-04-15 10:00:00.000',
      reference: null,
      status: 'pending',
      created_at: '2026-04-15',
      updated_at: '2026-04-15',
    };

    db.select
      .mockReturnValueOnce(thenable([pending]))
      .mockReturnValueOnce(
        thenable([
          {
            id: soPaymentId,
            sales_order_id: soId,
            payment_id: null,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            organization_id: orgId,
            customer_id: customerId,
          },
        ]),
      )
      .mockReturnValueOnce(
        thenable([{ ...pending, status: 'confirmed' }]),
      );

    await service.confirm(
      paymentId,
      { salesOrderPaymentId: soPaymentId },
      orgId,
    );

    expect(db.update).toHaveBeenCalled();
    expect(ledger.upsertReceivable).not.toHaveBeenCalled();
  });

  it('rejects confirm when not pending', async () => {
    db.select.mockReturnValueOnce(
      thenable([
        {
          id: paymentId,
          organization_id: orgId,
          customer_id: customerId,
          invoice_id: null,
          payment_method_id: null,
          amount: '10.0000',
          currency_id: null,
          paid_at: '2026-04-15 10:00:00.000',
          reference: null,
          status: 'confirmed',
          created_at: '2026-04-15',
          updated_at: '2026-04-15',
        },
      ]),
    );

    await expect(service.confirm(paymentId, {}, orgId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('reverses confirmed payment and rolls back invoice', async () => {
    const confirmed = {
      id: paymentId,
      organization_id: orgId,
      customer_id: customerId,
      invoice_id: invoiceId,
      payment_method_id: null,
      amount: '40.0000',
      currency_id: null,
      paid_at: '2026-04-15 10:00:00.000',
      reference: null,
      status: 'confirmed',
      created_at: '2026-04-15',
      updated_at: '2026-04-15',
    };
    const invoice = {
      id: invoiceId,
      organization_id: orgId,
      customer_id: customerId,
      total_amount: '100.0000',
      amount_paid: '40.0000',
      status: 'partially_paid',
      due_date: '2026-04-30',
      deleted_at: null,
    };

    db.select
      .mockReturnValueOnce(thenable([confirmed]))
      .mockReturnValueOnce(thenable([invoice]))
      .mockReturnValueOnce(
        thenable([{ ...confirmed, status: 'reversed' }]),
      );

    const result = await service.reverse(paymentId, orgId);

    expect(result.status).toBe('reversed');
    expect(ledger.upsertReceivable).toHaveBeenCalledWith(
      expect.objectContaining({
        amountPaid: '0.0000',
      }),
      db,
    );
  });

  it('rejects applying payment to draft invoice on create+confirm', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: invoiceId,
            organization_id: orgId,
            customer_id: customerId,
            status: 'draft',
          },
        ]),
      );

    // create will succeed linking draft invoice on create (pending), but
    // confirmImmediately applies — need invoice fetch inside apply
    db.select
      .mockReset()
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: invoiceId,
            organization_id: orgId,
            customer_id: customerId,
            status: 'draft',
            deleted_at: null,
          },
        ]),
      );

    // ensureInvoiceLinkable allows draft on create; apply fails on confirmImmediately
    // Actually ensureInvoiceLinkable doesn't check status - apply does.
    // With confirmImmediately, after insert it loads invoice again for apply.

    db.transaction.mockImplementationOnce(async (fn) => {
      // Re-wire selects for inside transaction apply
      db.select.mockReset().mockReturnValueOnce(
        thenable([
          {
            id: invoiceId,
            organization_id: orgId,
            customer_id: customerId,
            total_amount: '100.0000',
            amount_paid: '0.0000',
            status: 'draft',
            due_date: null,
            deleted_at: null,
          },
        ]),
      );
      return fn(db);
    });

    // First selects before transaction
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: customerId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: invoiceId,
            organization_id: orgId,
            customer_id: customerId,
            status: 'draft',
            deleted_at: null,
          },
        ]),
      );

    await expect(
      service.create(
        {
          organizationId: orgId,
          customerId,
          invoiceId,
          amount: '10.0000',
          paidAt: '2026-04-15T10:00:00.000Z',
          confirmImmediately: true,
        },
        orgId,
      ),
    ).rejects.toThrow(/Cannot apply payment to an invoice in status "draft"/);
  });
});

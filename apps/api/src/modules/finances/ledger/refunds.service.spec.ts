import { BadRequestException } from '@nestjs/common';
import { AccountsLedgerService } from './accounts-ledger.service';
import { RefundsService } from './refunds.service';

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

describe('RefundsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcustc';
  const invoiceId = '0191e6b8-4c3a-7b2d-9f1e-invinvinvinvin';
  const refundId = '0191e6b8-4c3a-7b2d-9f1e-refrefrefrefre';

  let service: RefundsService;
  let ledger: { upsertReceivable: jest.Mock };
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    transaction: jest.Mock;
  };

  const issuedRefund = {
    id: refundId,
    organization_id: orgId,
    invoice_id: invoiceId,
    customer_id: customerId,
    amount: '25.0000',
    currency_id: null,
    reason: 'Credit',
    status: 'issued',
    refunded_at: null,
    created_at: '2026-04-15',
    updated_at: '2026-04-15',
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
    service = new RefundsService(
      db as never,
      ledger as unknown as AccountsLedgerService,
    );
  });

  it('applies refund: reduces invoice total and upserts AR', async () => {
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
      .mockReturnValueOnce(thenable([issuedRefund]))
      .mockReturnValueOnce(thenable([invoice]))
      .mockReturnValueOnce(
        thenable([{ ...issuedRefund, status: 'applied' }]),
      );

    const result = await service.transition(
      refundId,
      { toStatus: 'applied' },
      orgId,
    );

    expect(result.status).toBe('applied');
    expect(ledger.upsertReceivable).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId,
        originalAmount: '75.0000',
        amountPaid: '0.0000',
      }),
      db,
    );
  });

  it('rejects apply when amount exceeds remaining', async () => {
    db.select
      .mockReturnValueOnce(thenable([issuedRefund]))
      .mockReturnValueOnce(
        thenable([
          {
            id: invoiceId,
            organization_id: orgId,
            customer_id: customerId,
            total_amount: '20.0000',
            amount_paid: '0.0000',
            status: 'issued',
            due_date: null,
            deleted_at: null,
          },
        ]),
      );

    await expect(
      service.transition(refundId, { toStatus: 'applied' }, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects draft → applied', async () => {
    db.select.mockReturnValueOnce(
      thenable([{ ...issuedRefund, status: 'draft' }]),
    );

    await expect(
      service.transition(refundId, { toStatus: 'applied' }, orgId),
    ).rejects.toThrow(/Invalid status transition/);
  });
});

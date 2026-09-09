import { AccountsLedgerService } from './accounts-ledger.service';

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

describe('AccountsLedgerService', () => {
  let service: AccountsLedgerService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new AccountsLedgerService(db as never);
  });

  it('inserts AR when missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await service.upsertReceivable({
      organizationId: 'org',
      customerId: 'cust',
      invoiceId: 'inv',
      originalAmount: '100.0000',
      amountPaid: '0',
      dueDate: '2026-04-30',
    });

    expect(db.insert).toHaveBeenCalled();
  });

  it('inserts AP when missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await service.upsertPayable({
      organizationId: 'org',
      supplierId: 'sup',
      purchaseOrderId: 'po',
      originalAmount: '500.0000',
      dueDate: '2026-05-01',
    });

    expect(db.insert).toHaveBeenCalled();
  });

  it('aggregates ageing buckets', async () => {
    const asOf = new Date('2026-05-01T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(asOf);

    db.select.mockReturnValueOnce(
      thenable([
        { due_date: '2026-04-20', balance_due: '10.0000', status: 'open' },
        { due_date: '2026-03-01', balance_due: '20.0000', status: 'partial' },
        { due_date: '2025-12-01', balance_due: '30.0000', status: 'open' },
      ]),
    );

    const buckets = await service.ageingReceivables('org');
    expect(buckets.find((b) => b.bucket === '0-30')?.count).toBe(1);
    expect(buckets.find((b) => b.bucket === '61-90')?.count).toBe(1);
    expect(buckets.find((b) => b.bucket === '90+')?.count).toBe(1);

    jest.useRealTimers();
  });
});

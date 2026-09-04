import { NotFoundException } from '@nestjs/common';
import { PaymentTermsService } from './payment-terms.service';

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

describe('PaymentTermsService', () => {
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-222222222222',
    organization_id: null as string | null,
    code: 'NET30',
    name: 'Net 30 days',
    days_due: 30,
    description: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: PaymentTermsService;
  let db: { select: jest.Mock; insert: jest.Mock; update: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };
    service = new PaymentTermsService(db as never);
  });

  it('lists payment terms scoped to org', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      'org-1',
    );

    expect(result.data[0].code).toBe('NET30');
    expect(result.data[0].daysDue).toBe(30);
  });

  it('soft-deletes', async () => {
    db.select.mockReturnValue(thenable([row]));
    db.update.mockReturnValue(thenable(undefined));

    await service.remove(row.id);
    expect(db.update).toHaveBeenCalled();
  });

  it('throws when missing', async () => {
    db.select.mockReturnValue(thenable([]));
    await expect(service.findOne(row.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

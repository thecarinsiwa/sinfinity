import { NotFoundException } from '@nestjs/common';
import { TaxesService } from './taxes.service';

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

describe('TaxesService', () => {
  const taxRow = {
    id: '0191e6b8-4c3a-7b2d-9f1e-eeeeeeeeeeee',
    organization_id: null as string | null,
    code: 'TVA16',
    name: 'TVA RDC 16%',
    rate: '16.0000',
    tax_type: 'vat' as const,
    country_id: null as string | null,
    is_active: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: TaxesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };
    service = new TaxesService(db as never);
  });

  it('lists taxes with rate as string', async () => {
    db.select
      .mockReturnValueOnce(thenable([taxRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, order: 'asc' },
      'org-1',
    );

    expect(result.data[0].rate).toBe('16.0000');
    expect(typeof result.data[0].rate).toBe('string');
  });

  it('creates a global tax when no org', async () => {
    db.insert.mockReturnValue(thenable(undefined));
    db.select.mockReturnValue(thenable([taxRow]));

    const created = await service.create({
      code: 'TVA16',
      name: 'TVA RDC 16%',
      rate: '16.0000',
      taxType: 'vat',
      organizationId: null,
    });

    expect(created.organizationId).toBeNull();
  });

  it('soft-deletes a tax', async () => {
    db.select.mockReturnValue(thenable([taxRow]));
    db.update.mockReturnValue(thenable(undefined));

    await service.remove(taxRow.id);
    expect(db.update).toHaveBeenCalled();
  });

  it('throws when tax not found', async () => {
    db.select.mockReturnValue(thenable([]));
    await expect(service.findOne(taxRow.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

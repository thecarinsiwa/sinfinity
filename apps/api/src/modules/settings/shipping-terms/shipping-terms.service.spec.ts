import { ConflictException, NotFoundException } from '@nestjs/common';
import { ShippingTermsService } from './shipping-terms.service';

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

describe('ShippingTermsService', () => {
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-333333333333',
    code: 'FOB',
    name: 'Free On Board',
    description: 'Seller delivers goods on board',
    incoterm_version: '2020',
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: ShippingTermsService;
  let db: { select: jest.Mock; insert: jest.Mock };

  beforeEach(() => {
    db = { select: jest.fn(), insert: jest.fn() };
    service = new ShippingTermsService(db as never);
  });

  it('lists shipping terms for selects', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 100,
      order: 'asc',
      incotermVersion: '2020',
    });

    expect(result.data[0]).toMatchObject({
      code: 'FOB',
      incotermVersion: '2020',
    });
  });

  it('defaults incoterm version to 2020 on create', async () => {
    db.insert.mockReturnValue(thenable(undefined));
    db.select.mockReturnValue(thenable([row]));

    const created = await service.create({
      code: 'fob',
      name: 'Free On Board',
    });

    expect(created.incotermVersion).toBe('2020');
    expect(db.insert).toHaveBeenCalled();
  });

  it('maps duplicate to ConflictException', async () => {
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ code: 'FOB', name: 'X' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when missing', async () => {
    db.select.mockReturnValue(thenable([]));
    await expect(service.findOne(row.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

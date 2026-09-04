import { ConflictException, NotFoundException } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';

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

describe('CurrenciesService', () => {
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-cccccccccccc',
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimal_places: 2,
    is_active: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: CurrenciesService;
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
    service = new CurrenciesService(db as never);
  });

  it('lists currencies', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      order: 'asc',
      code: 'usd',
    });

    expect(result.data[0].code).toBe('USD');
    expect(result.data[0].isActive).toBe(true);
  });

  it('maps duplicate to ConflictException', async () => {
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ code: 'USD', name: 'X', symbol: '$' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates on remove', async () => {
    db.select.mockReturnValue(thenable([row]));
    db.update.mockReturnValue(thenable(undefined));

    await service.remove(row.id);
    expect(db.update).toHaveBeenCalled();
  });

  it('findIdByCode throws when missing', async () => {
    db.select.mockReturnValue(thenable([]));
    await expect(service.findIdByCode('XXX')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

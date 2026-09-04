import { ConflictException, NotFoundException } from '@nestjs/common';
import { UnitsService } from './units.service';

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

describe('UnitsService', () => {
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-111111111111',
    code: 'PCS',
    name: 'Piece',
    symbol: 'pc',
    unit_type: 'count' as const,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: UnitsService;
  let db: { select: jest.Mock; insert: jest.Mock };

  beforeEach(() => {
    db = { select: jest.fn(), insert: jest.fn() };
    service = new UnitsService(db as never);
  });

  it('lists units for selects', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 100,
      order: 'asc',
    });

    expect(result.data[0]).toMatchObject({ code: 'PCS', unitType: 'count' });
  });

  it('maps duplicate to ConflictException', async () => {
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ code: 'PCS', name: 'Piece' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when missing', async () => {
    db.select.mockReturnValue(thenable([]));
    await expect(service.findOne(row.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

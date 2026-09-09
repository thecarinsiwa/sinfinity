import { ConflictException } from '@nestjs/common';
import { ShippingMethodsService } from './shipping-methods.service';

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
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('ShippingMethodsService', () => {
  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-methodmethod',
    code: 'SEA',
    name: 'Sea freight',
    description: 'Ocean / container shipping',
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: ShippingMethodsService;
  let db: { select: jest.Mock; insert: jest.Mock };
  let seedService: { seed: jest.Mock };

  beforeEach(() => {
    db = { select: jest.fn(), insert: jest.fn() };
    seedService = { seed: jest.fn().mockResolvedValue({ inserted: 0, updated: 4 }) };
    service = new ShippingMethodsService(db as never, seedService as never);
  });

  it('seeds then lists shipping methods', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 100,
      order: 'asc',
    });

    expect(seedService.seed).toHaveBeenCalled();
    expect(result.data[0].code).toBe('SEA');
  });

  it('uppercases code on create', async () => {
    db.insert.mockReturnValue(thenable(undefined));
    db.select.mockReturnValue(thenable([row]));

    const created = await service.create({
      code: 'sea',
      name: 'Sea freight',
    });

    expect(created.code).toBe('SEA');
    expect(db.insert).toHaveBeenCalled();
  });

  it('maps duplicate code to ConflictException', async () => {
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ code: 'SEA', name: 'X' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

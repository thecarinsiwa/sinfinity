import { ConflictException, NotFoundException } from '@nestjs/common';
import { CitiesService } from './cities.service';

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
  chain.innerJoin = jest.fn(self);
  chain.$dynamic = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('CitiesService', () => {
  const countryId = '0191e6b8-4c3a-7b2d-9f1e-aaaaaaaaaaaa';
  const cityRow = {
    id: '0191e6b8-4c3a-7b2d-9f1e-bbbbbbbbbbbb',
    country_id: countryId,
    name: 'Kinshasa',
    region: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: CitiesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new CitiesService(db as never);
  });

  it('lists cities filtered by countryId', async () => {
    db.select
      .mockReturnValueOnce(thenable([cityRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      order: 'asc',
      countryId,
    });

    expect(result.data[0].countryId).toBe(countryId);
    expect(result.meta.total).toBe(1);
  });

  it('lists cities filtered by countryCode via join', async () => {
    db.select
      .mockReturnValueOnce(thenable([cityRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      order: 'asc',
      countryCode: 'cd',
    });

    expect(result.data[0].name).toBe('Kinshasa');
    expect(result.meta.total).toBe(1);
  });

  it('rejects create when country is missing', async () => {
    db.select.mockReturnValue(thenable([]));

    await expect(
      service.create({ countryId, name: 'Kinshasa' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects duplicate city with null region', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: countryId }]))
      .mockReturnValueOnce(thenable([{ id: cityRow.id }]));

    await expect(
      service.create({ countryId, name: 'Kinshasa', region: '  ' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a city when unique', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: countryId }]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([cityRow]));
    db.insert.mockReturnValue(thenable(undefined));

    const created = await service.create({
      countryId,
      name: 'Kinshasa',
      region: '',
    });

    expect(created.countryId).toBe(countryId);
    expect(created.region).toBeNull();
  });

  it('updates a city', async () => {
    db.select
      .mockReturnValueOnce(thenable([cityRow]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(
        thenable([{ ...cityRow, name: 'Lubumbashi', region: 'Haut-Katanga' }]),
      );
    db.update.mockReturnValue(thenable(undefined));

    const updated = await service.update(cityRow.id, {
      name: 'Lubumbashi',
      region: 'Haut-Katanga',
    });

    expect(updated.name).toBe('Lubumbashi');
    expect(updated.region).toBe('Haut-Katanga');
  });

  it('removes a city', async () => {
    db.select.mockReturnValue(thenable([cityRow]));
    db.delete.mockReturnValue(thenable(undefined));

    await service.remove(cityRow.id);
    expect(db.delete).toHaveBeenCalled();
  });
});

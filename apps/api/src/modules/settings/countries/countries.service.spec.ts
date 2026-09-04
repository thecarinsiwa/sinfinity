import { ConflictException, NotFoundException } from '@nestjs/common';
import { CountriesService } from './countries.service';

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

describe('CountriesService', () => {
  const countryRow = {
    id: '0191e6b8-4c3a-7b2d-9f1e-2a3b4c5d6e7f',
    code: 'CD',
    code3: 'COD',
    name: 'Congo, Democratic Republic of the',
    phone_code: '+243',
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: CountriesService;
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
    service = new CountriesService(db as never);
  });

  it('lists countries with filters', async () => {
    const listChain = thenable([countryRow]);
    const countChain = thenable([{ total: 1 }]);
    db.select.mockReturnValueOnce(listChain).mockReturnValueOnce(countChain);

    const result = await service.findAll({
      page: 1,
      pageSize: 20,
      order: 'asc',
      code: 'cd',
      search: 'congo',
    });

    expect(result.meta.total).toBe(1);
    expect(result.data[0]).toEqual({
      id: countryRow.id,
      code: 'CD',
      code3: 'COD',
      name: countryRow.name,
      phoneCode: '+243',
      createdAt: countryRow.created_at,
      updatedAt: countryRow.updated_at,
    });
    expect(listChain.where).toHaveBeenCalled();
  });

  it('throws NotFoundException when country is missing', async () => {
    db.select.mockReturnValue(thenable([]));
    await expect(service.findOne(countryRow.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a country', async () => {
    db.insert.mockReturnValue(thenable(undefined));
    db.select.mockReturnValue(thenable([countryRow]));

    const created = await service.create({
      code: 'cd',
      name: countryRow.name,
      code3: 'cod',
      phoneCode: '+243',
    });

    expect(created.code).toBe('CD');
    expect(db.insert).toHaveBeenCalled();
  });

  it('maps duplicate insert to ConflictException', async () => {
    db.insert.mockReturnValue({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ code: 'CD', name: 'X' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates a country', async () => {
    db.select
      .mockReturnValueOnce(thenable([countryRow]))
      .mockReturnValueOnce(
        thenable([{ ...countryRow, name: 'DR Congo', phone_code: '+243' }]),
      );
    db.update.mockReturnValue(thenable(undefined));

    const updated = await service.update(countryRow.id, { name: 'DR Congo' });
    expect(updated.name).toBe('DR Congo');
  });

  it('removes a country', async () => {
    db.select.mockReturnValue(thenable([countryRow]));
    db.delete.mockReturnValue(thenable(undefined));

    await service.remove(countryRow.id);
    expect(db.delete).toHaveBeenCalled();
  });
});

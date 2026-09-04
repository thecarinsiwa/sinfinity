import { SYSTEM_QUOTATION_STATUSES } from './quotation-statuses.catalog';
import { QuotationStatusesSeedService } from './quotation-statuses-seed.service';

type Thenable<T> = PromiseLike<T> & Record<string, unknown>;

function thenable<T>(value: T): Thenable<T> {
  const chain: Thenable<T> = {
    then: (onFulfilled, onRejected) =>
      Promise.resolve(value).then(onFulfilled, onRejected),
  } as Thenable<T>;
  const self = () => chain;
  chain.from = jest.fn(self);
  chain.where = jest.fn(self);
  chain.limit = jest.fn(self);
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('QuotationStatusesSeedService', () => {
  it('inserts missing quotation statuses', async () => {
    const db = {
      select: jest.fn().mockReturnValue(thenable([])),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    const service = new QuotationStatusesSeedService(db as never);
    const result = await service.seed();
    expect(result.inserted).toBe(SYSTEM_QUOTATION_STATUSES.length);
    expect(result.updated).toBe(0);
    expect(db.insert).toHaveBeenCalledTimes(SYSTEM_QUOTATION_STATUSES.length);
  });

  it('updates existing quotation statuses', async () => {
    const db = {
      select: jest
        .fn()
        .mockReturnValue(thenable([{ id: 'status-existing' }])),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    const service = new QuotationStatusesSeedService(db as never);
    const result = await service.seed();
    expect(result.updated).toBe(SYSTEM_QUOTATION_STATUSES.length);
    expect(result.inserted).toBe(0);
  });
});

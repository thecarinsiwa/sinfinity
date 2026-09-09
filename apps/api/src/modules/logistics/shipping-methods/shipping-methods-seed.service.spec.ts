import { SYSTEM_SHIPPING_METHODS } from './shipping-methods.catalog';
import { ShippingMethodsSeedService } from './shipping-methods-seed.service';

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

describe('ShippingMethodsSeedService', () => {
  it('inserts missing system shipping methods', async () => {
    const db = {
      select: jest.fn().mockReturnValue(thenable([])),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };

    const service = new ShippingMethodsSeedService(db as never);
    const result = await service.seed();

    expect(result.inserted).toBe(SYSTEM_SHIPPING_METHODS.length);
    expect(result.updated).toBe(0);
    expect(db.insert).toHaveBeenCalledTimes(SYSTEM_SHIPPING_METHODS.length);
  });

  it('updates existing system shipping methods', async () => {
    const db = {
      select: jest.fn().mockReturnValue(thenable([{ id: 'existing-id' }])),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };

    const service = new ShippingMethodsSeedService(db as never);
    const result = await service.seed();

    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(SYSTEM_SHIPPING_METHODS.length);
    expect(db.update).toHaveBeenCalledTimes(SYSTEM_SHIPPING_METHODS.length);
  });
});

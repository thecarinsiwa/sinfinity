import { SYSTEM_DOCUMENT_TYPES } from './document-types.catalog';
import { DocumentTypesSeedService } from './document-types-seed.service';

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

describe('DocumentTypesSeedService', () => {
  it('inserts missing system document types', async () => {
    const db = {
      select: jest.fn().mockReturnValue(thenable([])),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };

    const service = new DocumentTypesSeedService(db as never);
    const result = await service.seed();

    expect(result.inserted).toBe(SYSTEM_DOCUMENT_TYPES.length);
    expect(result.updated).toBe(0);
    expect(db.insert).toHaveBeenCalledTimes(SYSTEM_DOCUMENT_TYPES.length);
  });

  it('updates existing system document types', async () => {
    const db = {
      select: jest
        .fn()
        .mockReturnValue(thenable([{ id: 'existing-id' }])),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };

    const service = new DocumentTypesSeedService(db as never);
    const result = await service.seed();

    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(SYSTEM_DOCUMENT_TYPES.length);
    expect(db.update).toHaveBeenCalledTimes(SYSTEM_DOCUMENT_TYPES.length);
  });
});

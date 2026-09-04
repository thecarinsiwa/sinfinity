import { RbacSeedService } from './rbac-seed.service';

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

describe('RbacSeedService', () => {
  it('inserts missing permissions and system roles', async () => {
    const db = {
      select: jest.fn().mockReturnValue(thenable([])),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };

    const service = new RbacSeedService(db as never);
    const result = await service.seed();

    expect(result.permissionsInserted).toBeGreaterThan(0);
    expect(result.rolesInserted).toBe(6);
    expect(result.rolePermissionsSynced).toBeGreaterThan(0);
    expect(db.insert).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
  });
});

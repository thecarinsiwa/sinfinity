import { ConflictException } from '@nestjs/common';
import { ProductModelsService } from './product-models.service';

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
  chain.innerJoin = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('ProductModelsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const brandId = '0191e6b8-4c3a-7b2d-9f1e-brandbrandbr';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  let service: ProductModelsService;
  let db: { select: jest.Mock; insert: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new ProductModelsService(db as never);
  });

  it('rejects duplicate manufacturerSku for the same brand', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: brandId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([{ id: 'other-model' }]));

    await expect(
      service.create(
        {
          brandId,
          name: 'Catalyst',
          manufacturerSku: 'C9300-24T',
        },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

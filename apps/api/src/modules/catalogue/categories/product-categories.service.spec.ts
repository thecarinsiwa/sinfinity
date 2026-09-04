import { BadRequestException, ConflictException } from '@nestjs/common';
import { ProductCategoriesService } from './product-categories.service';

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

describe('ProductCategoriesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const row = {
    id: '0191e6b8-4c3a-7b2d-9f1e-catcatcatcat',
    organization_id: orgId,
    code: 'IT',
    name: 'Informatique',
    parent_id: null as string | null,
    sort_order: 0,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: ProductCategoriesService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new ProductCategoriesService(db as never);
  });

  it('lists categories for org', async () => {
    db.select
      .mockReturnValueOnce(thenable([row]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20 },
      orgId,
      orgUser,
    );
    expect(result.data[0].code).toBe('IT');
  });

  it('returns a category tree', async () => {
    db.select.mockReturnValueOnce(thenable([row]));
    const tree = await service.findTree(undefined, orgId, orgUser);
    expect(tree[0].code).toBe('IT');
    expect(tree[0].children).toEqual([]);
  });

  it('rejects self as parent', async () => {
    db.select.mockReturnValueOnce(thenable([row]));

    await expect(
      service.update(
        row.id,
        { parentId: row.id },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps duplicate code to ConflictException', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create(
        { code: 'IT', name: 'Informatique' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

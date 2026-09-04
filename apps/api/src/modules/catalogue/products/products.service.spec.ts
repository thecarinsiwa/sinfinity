import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

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
  chain.innerJoin = jest.fn(self);
  return chain;
}

describe('ProductsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprod';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const productRow = {
    id: productId,
    organization_id: orgId,
    sku: 'SW-C9300',
    name: 'Catalyst',
    description: null as string | null,
    category_id: null as string | null,
    subcategory_id: null as string | null,
    brand_id: null as string | null,
    model_id: null as string | null,
    unit_id: null as string | null,
    base_price: '100.0000',
    currency_id: null as string | null,
    cost_price: null as string | null,
    is_serialized: 0,
    is_active: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: ProductsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new ProductsService(db as never);
  });

  it('creates a product and returns nested collections', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([productRow]))
      .mockReturnValueOnce(thenable([]))
      .mockReturnValueOnce(thenable([]));

    const result = await service.create(
      {
        sku: 'sw-c9300',
        name: 'Catalyst',
        basePrice: '100.0000',
        specifications: [{ specKey: 'Ports', specValue: '24' }],
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalledTimes(2);
    expect(result.sku).toBe('SW-C9300');
    expect(result.specifications).toEqual([]);
  });

  it('maps duplicate SKU to ConflictException', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ sku: 'X', name: 'Y' }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists products for org', async () => {
    db.select
      .mockReturnValueOnce(thenable([productRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20 },
      orgId,
      orgUser,
    );
    expect(result.data[0].sku).toBe('SW-C9300');
    expect(result.data[0].specifications).toBeUndefined();
  });

  it('throws when product is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));
    await expect(
      service.findOne(productId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('clears other primaries when adding a primary image', async () => {
    const imageRow = {
      id: '0191e6b8-4c3a-7b2d-9f1e-imgimgimgimg',
      product_id: productId,
      url: 'https://cdn.example.com/a.jpg',
      alt_text: null,
      is_primary: 1,
      sort_order: 0,
      created_at: '2026-09-04 10:00:00.000',
      updated_at: '2026-09-04 10:00:00.000',
    };

    db.select
      .mockReturnValueOnce(thenable([productRow]))
      .mockReturnValueOnce(thenable([imageRow]));

    const result = await service.addImage(
      productId,
      { url: 'https://cdn.example.com/a.jpg', isPrimary: true },
      orgId,
      orgUser,
    );

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(result.isPrimary).toBe(true);
  });
});

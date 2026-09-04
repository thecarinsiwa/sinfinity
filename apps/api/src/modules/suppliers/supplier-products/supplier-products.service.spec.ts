import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SupplierProductsService } from './supplier-products.service';

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
  chain.set = jest.fn(self);
  chain.values = jest.fn(self);
  return chain;
}

describe('SupplierProductsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const supplierId = '0191e6b8-4c3a-7b2d-9f1e-supsupsupsup';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprod';
  const linkId = '0191e6b8-4c3a-7b2d-9f1e-linklinklink';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const linkRow = {
    id: linkId,
    supplier_id: supplierId,
    product_id: productId,
    supplier_sku: 'SZ-SW-9300',
    unit_price: '850.0000',
    currency_id: null as string | null,
    moq: '10.0000',
    lead_time_days: 21,
    is_available: 1,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: SupplierProductsService;
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
    service = new SupplierProductsService(db as never);
  });

  it('creates a supplier product link', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: supplierId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([{ id: productId }]))
      .mockReturnValueOnce(
        thenable([{ ...linkRow, organization_id: orgId }]),
      );

    const result = await service.create(
      {
        supplierId,
        productId,
        supplierSku: 'SZ-SW-9300',
        unitPrice: '850.0000',
        moq: '10.0000',
        leadTimeDays: 21,
      },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.supplierSku).toBe('SZ-SW-9300');
    expect(result.unitPrice).toBe('850.0000');
  });

  it('maps duplicate supplier+product to ConflictException', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: supplierId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([{ id: productId }]));
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create({ supplierId, productId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists links filtered by productId (who sells)', async () => {
    db.select
      .mockReturnValueOnce(thenable([linkRow]))
      .mockReturnValueOnce(thenable([{ total: 1 }]));

    const result = await service.findAll(
      { page: 1, pageSize: 20, productId },
      orgId,
      orgUser,
    );
    expect(result.data[0].productId).toBe(productId);
    expect(result.data[0].supplierId).toBe(supplierId);
  });

  it('rejects product from another organization', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: supplierId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([]));

    await expect(
      service.create({ supplierId, productId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when link is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));

    await expect(
      service.findOne(linkId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

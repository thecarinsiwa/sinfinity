import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductServicesService } from './product-services.service';

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
  chain.innerJoin = jest.fn(self);
  chain.values = jest.fn(self);
  chain.set = jest.fn(self);
  return chain;
}

describe('ProductServicesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprod';
  const serviceId = '0191e6b8-4c3a-7b2d-9f1e-svcsvcsvcsvc';
  const linkId = '0191e6b8-4c3a-7b2d-9f1e-linklinklink';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const linkRow = {
    id: linkId,
    product_id: productId,
    service_id: serviceId,
    is_required: 1,
    default_quantity: '1.0000',
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    service_code: 'INST-SW',
    service_name: 'Switch installation',
  };

  let service: ProductServicesService;
  let db: { select: jest.Mock; insert: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
    };
    service = new ProductServicesService(db as never);
  });

  it('links a service to a product', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: productId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([{ id: serviceId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(thenable([linkRow]));

    const result = await service.create(
      productId,
      { serviceId, isRequired: true, defaultQuantity: '1.0000' },
      orgId,
      orgUser,
    );

    expect(result.serviceCode).toBe('INST-SW');
    expect(result.isRequired).toBe(true);
  });

  it('maps duplicate link to ConflictException', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([{ id: productId, organization_id: orgId }]),
      )
      .mockReturnValueOnce(
        thenable([{ id: serviceId, organization_id: orgId }]),
      );
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create(productId, { serviceId }, orgId, orgUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when product is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));
    await expect(
      service.listByProduct(productId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

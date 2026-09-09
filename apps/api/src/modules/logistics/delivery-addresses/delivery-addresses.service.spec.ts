import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryAddressesService } from './delivery-addresses.service';

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

describe('DeliveryAddressesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const addressId = '0191e6b8-4c3a-7b2d-9f1e-addraddraddr';
  const customerId = '0191e6b8-4c3a-7b2d-9f1e-custcustcust';
  const warehouseId = '0191e6b8-4c3a-7b2d-9f1e-warewareware';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
  };

  const addressRow = {
    id: addressId,
    organization_id: orgId,
    label: 'Chantier campus Nord',
    line1: '12 Avenue de la Paix',
    line2: null as string | null,
    city_id: null as string | null,
    country_id: null as string | null,
    contact_name: 'Site manager',
    contact_phone: null as string | null,
    customer_id: customerId,
    warehouse_id: null as string | null,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: DeliveryAddressesService;
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
    service = new DeliveryAddressesService(db as never);
  });

  it('creates an ad-hoc address linked to a customer', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          { id: customerId, organization_id: orgId, deleted_at: null },
        ]),
      )
      .mockReturnValueOnce(thenable([addressRow]));

    const result = await service.create(
      {
        label: 'Chantier campus Nord',
        line1: '12 Avenue de la Paix',
        customerId,
      },
      orgId,
      orgUser,
    );

    expect(result.customerId).toBe(customerId);
    expect(result.label).toBe('Chantier campus Nord');
  });

  it('rejects create without customerId and warehouseId', async () => {
    db.select.mockReturnValueOnce(thenable([{ id: orgId }]));

    await expect(
      service.create(
        { line1: 'Somewhere' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates an address linked to a warehouse', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([
          { id: warehouseId, organization_id: orgId, deleted_at: null },
        ]),
      )
      .mockReturnValueOnce(
        thenable([{ ...addressRow, customer_id: null, warehouse_id: warehouseId }]),
      );

    const result = await service.create(
      { line1: 'Dock 3', warehouseId },
      orgId,
      orgUser,
    );

    expect(result.warehouseId).toBe(warehouseId);
  });

  it('soft-deletes an address', async () => {
    db.select.mockReturnValueOnce(thenable([addressRow]));
    await service.remove(addressId, orgId, orgUser);
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects when address is missing', async () => {
    db.select.mockReturnValueOnce(thenable([]));
    await expect(
      service.findOne(addressId, orgId, orgUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

import { BadRequestException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';

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

describe('WarehousesService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const warehouseId = '0191e6b8-4c3a-7b2d-9f1e-whwhwhwhwhwh';
  const locationId = '0191e6b8-4c3a-7b2d-9f1e-loclocloclocl';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
    permissions: ['inventory.read', 'inventory.adjust'],
  };

  const warehouseRow = {
    id: warehouseId,
    organization_id: orgId,
    branch_id: null as string | null,
    code: 'KIN-MAIN',
    name: 'Entrepôt Kinshasa',
    address: null as string | null,
    city_id: null as string | null,
    manager_user_id: null as string | null,
    is_active: 1,
    created_at: '2026-09-09 10:00:00.000',
    updated_at: '2026-09-09 10:00:00.000',
    deleted_at: null as string | null,
  };

  let service: WarehousesService;
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
    service = new WarehousesService(db as never);
  });

  it('creates a warehouse', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(thenable([warehouseRow]));

    const result = await service.create(
      { code: 'kin-main', name: 'Entrepôt Kinshasa' },
      orgId,
      orgUser,
    );

    expect(result.code).toBe('KIN-MAIN');
    expect(result.name).toBe('Entrepôt Kinshasa');
    expect(db.insert).toHaveBeenCalled();
  });

  it('creates a location with A-01-03 style code', async () => {
    const locationRow = {
      id: locationId,
      warehouse_id: warehouseId,
      code: 'A-01-03',
      aisle: 'A',
      rack: '01',
      shelf: '03',
      is_active: 1,
      created_at: '2026-09-09 10:00:00.000',
      updated_at: '2026-09-09 10:00:00.000',
      deleted_at: null as string | null,
    };

    db.select
      .mockReturnValueOnce(thenable([warehouseRow])) // createLocation access
      .mockReturnValueOnce(thenable([warehouseRow])) // findLocation access
      .mockReturnValueOnce(thenable([locationRow])); // requireLocation

    const result = await service.createLocation(
      warehouseId,
      { code: 'a-01-03', aisle: 'A', rack: '01', shelf: '03' },
      orgId,
      orgUser,
    );

    expect(result.code).toBe('A-01-03');
    expect(result.aisle).toBe('A');
  });

  it('rejects warehouse delete when inventory exists', async () => {
    db.select
      .mockReturnValueOnce(thenable([warehouseRow]))
      .mockReturnValueOnce(thenable([{ id: 'inv-1' }]));

    await expect(
      service.remove(warehouseId, orgId, orgUser),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

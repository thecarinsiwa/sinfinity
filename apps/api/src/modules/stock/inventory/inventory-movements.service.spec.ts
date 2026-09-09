import { BadRequestException } from '@nestjs/common';
import { InventoryMovementsService } from './inventory-movements.service';

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

describe('InventoryMovementsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const warehouseId = '0191e6b8-4c3a-7b2d-9f1e-whwhwhwhwhwh';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprodp';
  const inventoryId = '0191e6b8-4c3a-7b2d-9f1e-invinvinvinvi';

  let service: InventoryMovementsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      transaction: jest.fn(async (fn: (tx: typeof db) => unknown) => fn(db)),
    };
    service = new InventoryMovementsService(db as never);
  });

  it('creates inventory on first in movement', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([
          { id: warehouseId, organization_id: orgId, deleted_at: null },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          { id: productId, organization_id: orgId, deleted_at: null },
        ]),
      )
      .mockReturnValueOnce(thenable([])); // no inventory yet

    const result = await service.applyMovement({
      organizationId: orgId,
      productId,
      warehouseId,
      movementType: 'in',
      quantity: '10',
      referenceType: 'purchase_receipt',
      referenceId: 'receipt-1',
    });

    expect(result.inventory.quantityOnHand).toBe('10.0000');
    expect(result.inventory.quantityAvailable).toBe('10.0000');
    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects out when available is insufficient', async () => {
    db.select
      .mockReturnValueOnce(
        thenable([
          { id: warehouseId, organization_id: orgId, deleted_at: null },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          { id: productId, organization_id: orgId, deleted_at: null },
        ]),
      )
      .mockReturnValueOnce(
        thenable([
          {
            id: inventoryId,
            organization_id: orgId,
            warehouse_id: warehouseId,
            location_id: null,
            product_id: productId,
            batch_id: null,
            quantity_on_hand: '5.0000',
            quantity_reserved: '3.0000',
            quantity_available: '2.0000',
            created_at: '2026-09-09 10:00:00.000',
            updated_at: '2026-09-09 10:00:00.000',
          },
        ]),
      );

    await expect(
      service.applyMovement({
        organizationId: orgId,
        productId,
        warehouseId,
        movementType: 'out',
        quantity: '3',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects direct transfer movement type', async () => {
    await expect(
      service.applyMovement({
        organizationId: orgId,
        productId,
        warehouseId,
        movementType: 'transfer' as never,
        quantity: '1',
      }),
    ).rejects.toThrow(/not applied directly/);
  });
});

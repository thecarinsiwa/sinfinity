import { BadRequestException } from '@nestjs/common';
import { StockReservationsService } from './stock-reservations.service';

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

describe('StockReservationsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const inventoryId = '0191e6b8-4c3a-7b2d-9f1e-invinvinvinvi';
  const reservationId = '0191e6b8-4c3a-7b2d-9f1e-resresresresr';
  const soItemId = '0191e6b8-4c3a-7b2d-9f1e-soitsoitsoits';
  const soId = '0191e6b8-4c3a-7b2d-9f1e-sososososososo';
  const warehouseId = '0191e6b8-4c3a-7b2d-9f1e-whwhwhwhwhwh';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprodp';

  let service: StockReservationsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };
  let inventoryMovementsService: { applyMovement: jest.Mock };

  const invRow = {
    id: inventoryId,
    organization_id: orgId,
    warehouse_id: warehouseId,
    location_id: null,
    product_id: productId,
    batch_id: null,
  };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      transaction: jest.fn(async (fn: (tx: typeof db) => unknown) => fn(db)),
    };
    inventoryMovementsService = {
      applyMovement: jest.fn().mockResolvedValue({}),
    };
    service = new StockReservationsService(
      db as never,
      inventoryMovementsService as never,
    );
  });

  it('create applies reserve movement', async () => {
    const created = {
      id: reservationId,
      inventory_id: inventoryId,
      sales_order_id: soId,
      sales_order_item_id: soItemId,
      quantity: '2.0000',
      status: 'active' as const,
      reserved_at: '2026-01-01 00:00:00.000',
      expires_at: null,
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
      organization_id: orgId,
    };

    db.select
      .mockReturnValueOnce(thenable([invRow]))
      .mockReturnValueOnce(
        thenable([
          {
            id: soItemId,
            sales_order_id: soId,
            organization_id: orgId,
          },
        ]),
      )
      .mockReturnValueOnce(thenable([created]));

    await service.create(
      {
        inventoryId,
        salesOrderItemId: soItemId,
        quantity: '2',
      },
      orgId,
    );

    expect(inventoryMovementsService.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        movementType: 'reserve',
        quantity: '2.0000',
        referenceType: 'stock_reservation',
      }),
      db,
    );
  });

  it('fulfill unreserves then outs', async () => {
    const active = {
      id: reservationId,
      inventory_id: inventoryId,
      sales_order_id: soId,
      sales_order_item_id: soItemId,
      quantity: '2.0000',
      status: 'active' as const,
      reserved_at: '2026-01-01 00:00:00.000',
      expires_at: null,
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
      organization_id: orgId,
    };
    const fulfilled = { ...active, status: 'fulfilled' as const };

    db.select
      .mockReturnValueOnce(thenable([active]))
      .mockReturnValueOnce(thenable([invRow]))
      .mockReturnValueOnce(thenable([])) // loadReservedSerialIds — non-serialized
      .mockReturnValueOnce(thenable([fulfilled]));

    await service.fulfill(reservationId, orgId);

    expect(inventoryMovementsService.applyMovement).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ movementType: 'unreserve', quantity: '2.0000' }),
      db,
    );
    expect(inventoryMovementsService.applyMovement).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ movementType: 'out', quantity: '2.0000' }),
      db,
    );
  });

  it('rejects release when not active', async () => {
    db.select.mockReturnValueOnce(
      thenable([
        {
          id: reservationId,
          inventory_id: inventoryId,
          sales_order_id: soId,
          sales_order_item_id: soItemId,
          quantity: '2.0000',
          status: 'released',
          reserved_at: '2026-01-01 00:00:00.000',
          expires_at: null,
          created_at: '2026-01-01 00:00:00.000',
          updated_at: '2026-01-01 00:00:00.000',
          organization_id: orgId,
        },
      ]),
    );

    await expect(
      service.release(reservationId, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(inventoryMovementsService.applyMovement).not.toHaveBeenCalled();
  });
});

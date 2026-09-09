import { BadRequestException } from '@nestjs/common';
import { StockTransfersService } from './stock-transfers.service';
import { STOCK_TRANSFER_STATUS } from './stock-transfer-statuses';

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

describe('StockTransfersService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const fromWh = '0191e6b8-4c3a-7b2d-9f1e-whfromwhfromw';
  const toWh = '0191e6b8-4c3a-7b2d-9f1e-whtowhtowhtow';
  const transferId = '0191e6b8-4c3a-7b2d-9f1e-trftrftrftrf';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprodp';

  let service: StockTransfersService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };
  let inventoryMovementsService: {
    applyMovement: jest.Mock;
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
    service = new StockTransfersService(
      db as never,
      inventoryMovementsService as never,
    );
  });

  it('rejects create when warehouses are identical', async () => {
    await expect(
      service.create(
        {
          organizationId: orgId,
          transferNumber: 'TRF-1',
          fromWarehouseId: fromWh,
          toWarehouseId: fromWh,
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('draft → in_transit requires lines and applies out movements', async () => {
    const draft = {
      id: transferId,
      organization_id: orgId,
      transfer_number: 'TRF-1',
      from_warehouse_id: fromWh,
      to_warehouse_id: toWh,
      status: STOCK_TRANSFER_STATUS.DRAFT,
      transferred_at: null,
      requested_by: null,
      approved_by: null,
      created_at: '2026-01-01 00:00:00.000',
      updated_at: '2026-01-01 00:00:00.000',
    };

    db.select
      .mockReturnValueOnce(thenable([draft]))
      .mockReturnValueOnce(
        thenable([{ ...draft, status: STOCK_TRANSFER_STATUS.IN_TRANSIT }]),
      );

    await service.transition(
      transferId,
      {
        toStatus: 'in_transit',
        lines: [{ productId, quantity: '3' }],
      },
      orgId,
    );

    expect(inventoryMovementsService.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        movementType: 'out',
        warehouseId: fromWh,
        quantity: '3.0000',
        referenceType: 'stock_transfer',
        referenceId: transferId,
      }),
      db,
    );
    expect(db.update).toHaveBeenCalled();
  });

  it('rejects draft → in_transit without lines', async () => {
    db.select.mockReturnValueOnce(
      thenable([
        {
          id: transferId,
          organization_id: orgId,
          transfer_number: 'TRF-1',
          from_warehouse_id: fromWh,
          to_warehouse_id: toWh,
          status: STOCK_TRANSFER_STATUS.DRAFT,
          transferred_at: null,
          requested_by: null,
          approved_by: null,
          created_at: '2026-01-01 00:00:00.000',
          updated_at: '2026-01-01 00:00:00.000',
        },
      ]),
    );

    await expect(
      service.transition(transferId, { toStatus: 'in_transit' }, orgId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(inventoryMovementsService.applyMovement).not.toHaveBeenCalled();
  });
});

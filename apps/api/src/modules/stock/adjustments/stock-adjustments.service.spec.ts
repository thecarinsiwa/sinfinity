import { BadRequestException } from '@nestjs/common';
import { StockAdjustmentsService } from './stock-adjustments.service';

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

describe('StockAdjustmentsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const warehouseId = '0191e6b8-4c3a-7b2d-9f1e-whwhwhwhwhwh';
  const productId = '0191e6b8-4c3a-7b2d-9f1e-prodprodprodp';

  let service: StockAdjustmentsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    transaction: jest.Mock;
  };
  let inventoryMovementsService: { applyMovement: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      transaction: jest.fn(async (fn: (tx: typeof db) => unknown) => fn(db)),
    };
    inventoryMovementsService = {
      applyMovement: jest.fn().mockResolvedValue({}),
    };
    service = new StockAdjustmentsService(
      db as never,
      inventoryMovementsService as never,
    );
  });

  it('applies signed delta via applyMovement(adjustment)', async () => {
    const created = {
      id: '0191e6b8-4c3a-7b2d-9f1e-adjadjadjadja',
      organization_id: orgId,
      warehouse_id: warehouseId,
      product_id: productId,
      quantity_before: '10.0000',
      quantity_after: '8.0000',
      reason: 'count' as const,
      adjusted_by: null,
      adjusted_at: '2026-01-01 00:00:00.000',
      notes: null,
      created_at: '2026-01-01 00:00:00.000',
    };

    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }])) // ensureOrganizationExists
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
      .mockReturnValueOnce(thenable([{ quantity_on_hand: '10.0000' }]))
      .mockReturnValueOnce(thenable([created]));

    await service.create(
      {
        organizationId: orgId,
        warehouseId,
        productId,
        quantityAfter: '8',
        reason: 'count',
      },
      orgId,
    );

    expect(inventoryMovementsService.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        movementType: 'adjustment',
        quantity: '-2.0000',
        referenceType: 'stock_adjustment',
      }),
      db,
    );
    expect(db.insert).toHaveBeenCalled();
  });

  it('rejects zero delta', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
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
      .mockReturnValueOnce(thenable([{ quantity_on_hand: '5.0000' }]));

    await expect(
      service.create(
        {
          organizationId: orgId,
          warehouseId,
          productId,
          quantityAfter: '5',
          reason: 'count',
        },
        orgId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(inventoryMovementsService.applyMovement).not.toHaveBeenCalled();
  });
});

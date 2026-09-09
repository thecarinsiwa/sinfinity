import { StockInventoryPortAdapter } from './inventory-port.adapter';
import type { InventoryMovementsService } from './inventory-movements.service';

describe('StockInventoryPortAdapter', () => {
  const orgId = 'org-1';
  const warehouseId = 'wh-1';

  let adapter: StockInventoryPortAdapter;
  let movements: { applyMovement: jest.Mock };
  let db: { transaction: jest.Mock };

  beforeEach(() => {
    movements = { applyMovement: jest.fn().mockResolvedValue(undefined) };
    db = {
      transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        fn({ tag: 'tx' }),
      ),
    };
    adapter = new StockInventoryPortAdapter(
      db as never,
      movements as unknown as InventoryMovementsService,
    );
  });

  it('no-ops when warehouseId is null', async () => {
    await adapter.recordInbound({
      organizationId: orgId,
      warehouseId: null,
      purchaseReceiptId: 'r1',
      movedAt: '2026-09-09 10:00:00.000',
      movedBy: null,
      lines: [{ purchaseOrderItemId: 'poi', productId: 'p1', quantity: '2' }],
    });
    expect(db.transaction).not.toHaveBeenCalled();
    expect(movements.applyMovement).not.toHaveBeenCalled();
  });

  it('applies in movements for lines with productId', async () => {
    await adapter.recordInbound({
      organizationId: orgId,
      warehouseId,
      purchaseReceiptId: 'r1',
      movedAt: '2026-09-09 10:00:00.000',
      movedBy: 'user-1',
      lines: [
        {
          purchaseOrderItemId: 'poi-1',
          productId: 'p1',
          quantity: '2',
          serialNumbers: ['SN-1', 'SN-2'],
        },
        { purchaseOrderItemId: 'poi-2', productId: null, quantity: '1' },
      ],
    });

    expect(db.transaction).toHaveBeenCalled();
    expect(movements.applyMovement).toHaveBeenCalledTimes(1);
    expect(movements.applyMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        movementType: 'in',
        productId: 'p1',
        quantity: '2',
        referenceType: 'purchase_receipt',
        referenceId: 'r1',
        warehouseId,
        serialNumbers: ['SN-1', 'SN-2'],
        purchaseOrderItemId: 'poi-1',
      }),
      { tag: 'tx' },
    );
  });
});

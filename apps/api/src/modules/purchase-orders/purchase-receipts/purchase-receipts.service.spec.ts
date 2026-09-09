import { BadRequestException, ConflictException } from '@nestjs/common';
import { PurchaseReceiptsService } from './purchase-receipts.service';

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

describe('PurchaseReceiptsService', () => {
  const orgId = '0191e6b8-4c3a-7b2d-9f1e-orgorgorgorg';
  const poId = '0191e6b8-4c3a-7b2d-9f1e-popopopopopo';
  const receiptId = '0191e6b8-4c3a-7b2d-9f1e-receiptrece';
  const itemId = '0191e6b8-4c3a-7b2d-9f1e-itemitemitem';
  const orgUser = {
    id: 'user-1',
    organizationId: orgId,
    isSuperAdmin: false,
    permissions: ['purchase_orders.read', 'purchase_orders.write'],
  };

  const receiptRow = {
    id: receiptId,
    organization_id: orgId,
    purchase_order_id: poId,
    receipt_number: 'BR-2026-001',
    warehouse_id: null as string | null,
    received_at: null as string | null,
    received_by: null as string | null,
    shipment_id: null as string | null,
    notes: null as string | null,
    status: 'draft' as const,
    created_at: '2026-09-04 10:00:00.000',
    updated_at: '2026-09-04 10:00:00.000',
  };

  let service: PurchaseReceiptsService;
  let db: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    transaction: jest.Mock;
  };
  let inventoryPort: { recordInbound: jest.Mock };

  beforeEach(() => {
    db = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      delete: jest.fn().mockReturnValue(thenable(undefined)),
      transaction: jest.fn(),
    };
    inventoryPort = { recordInbound: jest.fn().mockResolvedValue(undefined) };
    const ledger = {
      upsertPayable: jest.fn().mockResolvedValue(undefined),
    };
    service = new PurchaseReceiptsService(
      db as never,
      inventoryPort as never,
      ledger as never,
    );
  });

  it('creates a draft receipt with unique receiptNumber', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }])) // ensureOrganizationExists
      .mockReturnValueOnce(
        thenable([{ id: poId, organization_id: orgId, deleted_at: null }]),
      ) // purchase order exists
      .mockReturnValueOnce(thenable([receiptRow])); // findOne

    const result = await service.create(
      { purchaseOrderId: poId, receiptNumber: 'BR-2026-001' },
      orgId,
      orgUser,
    );

    expect(db.insert).toHaveBeenCalled();
    expect(result.status).toBe('draft');
    expect(result.receiptNumber).toBe('BR-2026-001');
  });

  it('maps duplicate receipt number to ConflictException', async () => {
    db.select
      .mockReturnValueOnce(thenable([{ id: orgId }]))
      .mockReturnValueOnce(
        thenable([{ id: poId, organization_id: orgId, deleted_at: null }]),
      );
    db.insert.mockReturnValueOnce({
      values: jest.fn().mockRejectedValue({ errno: 1062 }),
    });

    await expect(
      service.create(
        { purchaseOrderId: poId, receiptNumber: 'BR-2026-001' },
        orgId,
        orgUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('hard-deletes draft only', async () => {
    db.select.mockReturnValueOnce(thenable([receiptRow]));
    await service.remove(receiptId, orgId, orgUser);
    expect(db.delete).toHaveBeenCalled();

    db.select.mockReturnValueOnce(thenable([{ ...receiptRow, status: 'confirmed' }]));
    await expect(service.remove(receiptId, orgId, orgUser)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('confirms receipt: increments qty_received, sets PO status to partial, and calls InventoryPort', async () => {
    const tx = {
      select: jest.fn(),
      update: jest.fn().mockReturnValue(thenable(undefined)),
      insert: jest.fn().mockReturnValue(thenable(undefined)),
    };
    db.transaction.mockImplementation(async (fn: (t: typeof tx) => unknown) =>
      fn(tx),
    );

    tx.select
      .mockReturnValueOnce(thenable([receiptRow])) // receipt
      .mockReturnValueOnce(
        thenable([
          {
            id: poId,
            organization_id: orgId,
            status: 'confirmed',
            deleted_at: null,
          },
        ]),
      ) // PO
      .mockReturnValueOnce(
        thenable([
          {
            id: itemId,
            purchase_order_id: poId,
            product_id: null,
            quantity: '10.0000',
            quantity_received: '0.0000',
          },
        ]),
      ) // item lookup
      .mockReturnValueOnce(
        thenable([
          {
            id: itemId,
            purchase_order_id: poId,
            product_id: null,
            quantity: '10.0000',
            quantity_received: '4.0000',
          },
        ]),
      ); // items after update

    db.select.mockReturnValueOnce(thenable([{ ...receiptRow, status: 'confirmed' }]));

    const result = await service.confirm(
      receiptId,
      { lines: [{ purchaseOrderItemId: itemId, quantity: '4' }] },
      orgId,
      orgUser,
    );

    expect(result.status).toBe('confirmed');
    expect(tx.update).toHaveBeenCalled();
    expect(tx.insert).toHaveBeenCalled();
    expect(inventoryPort.recordInbound).toHaveBeenCalled();
  });
});


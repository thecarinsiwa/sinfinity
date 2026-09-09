import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../../../database/database.constants';
import type { DrizzleDB } from '../../../database/database.types';
import type {
  InventoryInboundInput,
  InventoryPort,
} from '../../purchase-orders/inventory/inventory.port';
import { InventoryMovementsService } from './inventory-movements.service';

/**
 * Real InventoryPort: confirms purchase receipts into stock via applyMovement.
 * No-op when warehouseId is null (receipt without warehouse).
 */
@Injectable()
export class StockInventoryPortAdapter implements InventoryPort {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  async recordInbound(input: InventoryInboundInput): Promise<void> {
    if (!input.warehouseId) {
      return;
    }

    const warehouseId = input.warehouseId;
    await this.db.transaction(async (tx) => {
      for (const line of input.lines) {
        if (!line.productId) {
          continue;
        }
        await this.inventoryMovementsService.applyMovement(
          {
            organizationId: input.organizationId,
            productId: line.productId,
            warehouseId,
            movementType: 'in',
            quantity: line.quantity,
            referenceType: 'purchase_receipt',
            referenceId: input.purchaseReceiptId,
            movedAt: input.movedAt,
            movedBy: input.movedBy,
            notes: `PO item ${line.purchaseOrderItemId}`,
          },
          tx,
        );
      }
    });
  }
}

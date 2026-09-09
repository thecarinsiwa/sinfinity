import { Module } from '@nestjs/common';
import { INVENTORY_PORT } from './inventory/inventory.port';
import { NoopInventoryPort } from './inventory/noop-inventory.port';
import { PurchaseOrderPaymentsController } from './purchase-order-payments/purchase-order-payments.controller';
import { PurchaseOrderPaymentsService } from './purchase-order-payments/purchase-order-payments.service';
import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service';
import { PurchaseReceiptsController } from './purchase-receipts/purchase-receipts.controller';
import { PurchaseReceiptsService } from './purchase-receipts/purchase-receipts.service';

@Module({
  controllers: [
    PurchaseOrdersController,
    PurchaseOrderPaymentsController,
    PurchaseReceiptsController,
  ],
  providers: [
    PurchaseOrdersService,
    PurchaseOrderPaymentsService,
    PurchaseReceiptsService,
    { provide: INVENTORY_PORT, useClass: NoopInventoryPort },
  ],
  exports: [
    PurchaseOrdersService,
    PurchaseOrderPaymentsService,
    PurchaseReceiptsService,
    INVENTORY_PORT,
  ],
})
export class PurchaseOrdersModule {}

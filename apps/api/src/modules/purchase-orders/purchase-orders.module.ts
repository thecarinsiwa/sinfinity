import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { StockInventoryPortAdapter } from '../stock/inventory/inventory-port.adapter';
import { INVENTORY_PORT } from './inventory/inventory.port';
import { PurchaseOrderPaymentsController } from './purchase-order-payments/purchase-order-payments.controller';
import { PurchaseOrderPaymentsService } from './purchase-order-payments/purchase-order-payments.service';
import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service';
import { PurchaseReceiptsController } from './purchase-receipts/purchase-receipts.controller';
import { PurchaseReceiptsService } from './purchase-receipts/purchase-receipts.service';

@Module({
  imports: [StockModule],
  controllers: [
    PurchaseOrdersController,
    PurchaseOrderPaymentsController,
    PurchaseReceiptsController,
  ],
  providers: [
    PurchaseOrdersService,
    PurchaseOrderPaymentsService,
    PurchaseReceiptsService,
    { provide: INVENTORY_PORT, useExisting: StockInventoryPortAdapter },
  ],
  exports: [
    PurchaseOrdersService,
    PurchaseOrderPaymentsService,
    PurchaseReceiptsService,
    INVENTORY_PORT,
  ],
})
export class PurchaseOrdersModule {}

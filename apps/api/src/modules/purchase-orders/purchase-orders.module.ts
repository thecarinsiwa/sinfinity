import { Module } from '@nestjs/common';
import { PurchaseOrderPaymentsController } from './purchase-order-payments/purchase-order-payments.controller';
import { PurchaseOrderPaymentsService } from './purchase-order-payments/purchase-order-payments.service';
import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service';

@Module({
  controllers: [PurchaseOrdersController, PurchaseOrderPaymentsController],
  providers: [PurchaseOrdersService, PurchaseOrderPaymentsService],
  exports: [PurchaseOrdersService, PurchaseOrderPaymentsService],
})
export class PurchaseOrdersModule {}

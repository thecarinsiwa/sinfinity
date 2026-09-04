import { Module } from '@nestjs/common';
import { SalesOrderDocumentsController } from './sales-order-documents/sales-order-documents.controller';
import { SalesOrderDocumentsService } from './sales-order-documents/sales-order-documents.service';
import { SalesOrderPaymentsController } from './sales-order-payments/sales-order-payments.controller';
import { SalesOrderPaymentsService } from './sales-order-payments/sales-order-payments.service';
import { SalesOrdersController } from './sales-orders/sales-orders.controller';
import { SalesOrdersService } from './sales-orders/sales-orders.service';

@Module({
  controllers: [
    SalesOrdersController,
    SalesOrderPaymentsController,
    SalesOrderDocumentsController,
  ],
  providers: [
    SalesOrdersService,
    SalesOrderPaymentsService,
    SalesOrderDocumentsService,
  ],
  exports: [
    SalesOrdersService,
    SalesOrderPaymentsService,
    SalesOrderDocumentsService,
  ],
})
export class SalesOrdersModule {}

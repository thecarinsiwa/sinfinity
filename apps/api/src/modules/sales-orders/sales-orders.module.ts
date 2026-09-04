import { Module } from '@nestjs/common';
import { SalesOrdersController } from './sales-orders/sales-orders.controller';
import { SalesOrdersService } from './sales-orders/sales-orders.service';

@Module({
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}

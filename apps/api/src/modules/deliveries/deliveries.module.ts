import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { DeliveriesController } from './deliveries/deliveries.controller';
import { DeliveriesService } from './deliveries/deliveries.service';

/**
 * Phase 14 — Livraisons clients (CRUD + start/complete stock out; tracking/POD follow).
 */
@Module({
  imports: [StockModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}

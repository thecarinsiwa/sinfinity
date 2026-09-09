import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { DeliveriesController } from './deliveries/deliveries.controller';
import { DeliveriesService } from './deliveries/deliveries.service';

/**
 * Phase 14 — Livraisons clients (CRUD, stock out, tracking, confirmations/POD).
 */
@Module({
  imports: [StockModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}

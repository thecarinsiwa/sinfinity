import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries/deliveries.controller';
import { DeliveriesService } from './deliveries/deliveries.service';

/**
 * Phase 14 — Livraisons clients (core CRUD; start/complete, tracking, POD follow).
 */
@Module({
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}

import { Module } from '@nestjs/common';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryMovementsService } from './inventory/inventory-movements.service';
import { StockInventoryPortAdapter } from './inventory/inventory-port.adapter';
import { WarehousesController } from './warehouses/warehouses.controller';
import { WarehousesService } from './warehouses/warehouses.service';

/**
 * Phase 13 — Entrepôts et stock.
 * Ops (transfers/adjustments/reservations) and trace land in subsequent branches.
 */
@Module({
  controllers: [WarehousesController, InventoryController],
  providers: [
    WarehousesService,
    InventoryMovementsService,
    StockInventoryPortAdapter,
  ],
  exports: [
    WarehousesService,
    InventoryMovementsService,
    StockInventoryPortAdapter,
  ],
})
export class StockModule {}

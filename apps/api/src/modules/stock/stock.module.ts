import { Module } from '@nestjs/common';
import { StockAdjustmentsController } from './adjustments/stock-adjustments.controller';
import { StockAdjustmentsService } from './adjustments/stock-adjustments.service';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryMovementsService } from './inventory/inventory-movements.service';
import { StockInventoryPortAdapter } from './inventory/inventory-port.adapter';
import { StockReservationsController } from './reservations/stock-reservations.controller';
import { StockReservationsService } from './reservations/stock-reservations.service';
import { StockTransfersController } from './transfers/stock-transfers.controller';
import { StockTransfersService } from './transfers/stock-transfers.service';
import { WarehousesController } from './warehouses/warehouses.controller';
import { WarehousesService } from './warehouses/warehouses.service';

/**
 * Phase 13 — Entrepôts et stock.
 * Trace (batches / serial numbers) lands in a subsequent branch.
 */
@Module({
  controllers: [
    WarehousesController,
    InventoryController,
    StockTransfersController,
    StockAdjustmentsController,
    StockReservationsController,
  ],
  providers: [
    WarehousesService,
    InventoryMovementsService,
    StockInventoryPortAdapter,
    StockTransfersService,
    StockAdjustmentsService,
    StockReservationsService,
  ],
  exports: [
    WarehousesService,
    InventoryMovementsService,
    StockInventoryPortAdapter,
    StockTransfersService,
    StockAdjustmentsService,
    StockReservationsService,
  ],
})
export class StockModule {}

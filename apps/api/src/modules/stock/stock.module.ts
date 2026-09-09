import { Module } from '@nestjs/common';
import { StockAdjustmentsController } from './adjustments/stock-adjustments.controller';
import { StockAdjustmentsService } from './adjustments/stock-adjustments.service';
import { InventoryBatchesController } from './batches/inventory-batches.controller';
import { InventoryBatchesService } from './batches/inventory-batches.service';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryMovementsService } from './inventory/inventory-movements.service';
import { StockInventoryPortAdapter } from './inventory/inventory-port.adapter';
import { StockReservationsController } from './reservations/stock-reservations.controller';
import { StockReservationsService } from './reservations/stock-reservations.service';
import { SerialNumbersController } from './serials/serial-numbers.controller';
import { SerialNumbersService } from './serials/serial-numbers.service';
import { StockTransfersController } from './transfers/stock-transfers.controller';
import { StockTransfersService } from './transfers/stock-transfers.service';
import { WarehousesController } from './warehouses/warehouses.controller';
import { WarehousesService } from './warehouses/warehouses.service';

/**
 * Phase 13 — Entrepôts et stock (warehouses, inventory, ops, batches, serials).
 */
@Module({
  controllers: [
    WarehousesController,
    InventoryController,
    StockTransfersController,
    StockAdjustmentsController,
    StockReservationsController,
    InventoryBatchesController,
    SerialNumbersController,
  ],
  providers: [
    WarehousesService,
    SerialNumbersService,
    InventoryMovementsService,
    StockInventoryPortAdapter,
    StockTransfersService,
    StockAdjustmentsService,
    StockReservationsService,
    InventoryBatchesService,
  ],
  exports: [
    WarehousesService,
    InventoryMovementsService,
    StockInventoryPortAdapter,
    StockTransfersService,
    StockAdjustmentsService,
    StockReservationsService,
    InventoryBatchesService,
    SerialNumbersService,
  ],
})
export class StockModule {}

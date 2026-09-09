import { MODULE_METADATA } from '@nestjs/common/constants';
import { StockInventoryPortAdapter } from '../stock/inventory/inventory-port.adapter';
import { StockModule } from '../stock/stock.module';
import { INVENTORY_PORT } from './inventory/inventory.port';
import { PurchaseOrdersModule } from './purchase-orders.module';

/**
 * Ensures receipt confirm uses the real stock adapter (applyMovement),
 * not NoopInventoryPort.
 */
describe('PurchaseOrdersModule inventory wiring', () => {
  it('imports StockModule and binds INVENTORY_PORT to StockInventoryPortAdapter', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      PurchaseOrdersModule,
    ) as unknown[];
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      PurchaseOrdersModule,
    ) as Array<unknown>;

    expect(imports).toContain(StockModule);

    const inventoryBinding = providers.find(
      (p) =>
        typeof p === 'object' &&
        p !== null &&
        'provide' in p &&
        (p as { provide: unknown }).provide === INVENTORY_PORT,
    ) as { provide: unknown; useExisting: unknown };

    expect(inventoryBinding).toBeDefined();
    expect(inventoryBinding.useExisting).toBe(StockInventoryPortAdapter);
  });
});

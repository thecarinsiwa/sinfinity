import { Injectable } from '@nestjs/common';
import type { InventoryInboundInput, InventoryPort } from './inventory.port';

/**
 * Kept for unit tests that inject a no-op. Production wiring uses
 * StockInventoryPortAdapter from StockModule.
 */
@Injectable()
export class NoopInventoryPort implements InventoryPort {
  async recordInbound(_input: InventoryInboundInput): Promise<void> {
    // intentionally empty
  }
}

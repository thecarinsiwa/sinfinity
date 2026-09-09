import { Injectable } from '@nestjs/common';
import type { InventoryInboundInput, InventoryPort } from './inventory.port';

/**
 * TODO(Phase 13): replace with a provider that inserts inventory_movements
 * (movement_type: 'in', reference_type: 'purchase_receipt', reference_id).
 */
@Injectable()
export class NoopInventoryPort implements InventoryPort {
  async recordInbound(_input: InventoryInboundInput): Promise<void> {
    // no-op until stock module (m11 / Phase 13) is wired
  }
}

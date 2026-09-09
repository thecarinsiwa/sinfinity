/** Decimal string math for inventory quantities (4 dp). */

export function formatDecimal(value: number, scale = 4): string {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid decimal value');
  }
  return value.toFixed(scale);
}

export function computeAvailable(
  onHand: string | number,
  reserved: string | number,
): string {
  return formatDecimal(Number(onHand) - Number(reserved));
}

export type InventoryQtyState = {
  quantityOnHand: string;
  quantityReserved: string;
  quantityAvailable: string;
};

export type MovementType =
  | 'in'
  | 'out'
  | 'reserve'
  | 'unreserve'
  | 'adjustment';

/**
 * Pure quantity transition. Throws Error on insufficient stock / invalid input.
 * `quantity` is absolute > 0 for in/out/reserve/unreserve; signed delta for adjustment.
 */
export function applyQuantityDelta(
  state: InventoryQtyState,
  movementType: MovementType,
  quantity: string | number,
): InventoryQtyState {
  const qty = Number(quantity);
  if (!Number.isFinite(qty)) {
    throw new Error('Invalid quantity');
  }

  let onHand = Number(state.quantityOnHand);
  let reserved = Number(state.quantityReserved);

  switch (movementType) {
    case 'in': {
      if (!(qty > 0)) throw new Error('in quantity must be greater than zero');
      onHand += qty;
      break;
    }
    case 'out': {
      if (!(qty > 0)) throw new Error('out quantity must be greater than zero');
      const available = onHand - reserved;
      if (available + 1e-12 < qty) {
        throw new Error(
          `Insufficient available quantity (have ${formatDecimal(available)}, need ${formatDecimal(qty)})`,
        );
      }
      onHand -= qty;
      break;
    }
    case 'reserve': {
      if (!(qty > 0))
        throw new Error('reserve quantity must be greater than zero');
      const available = onHand - reserved;
      if (available + 1e-12 < qty) {
        throw new Error(
          `Insufficient available quantity to reserve (have ${formatDecimal(available)}, need ${formatDecimal(qty)})`,
        );
      }
      reserved += qty;
      break;
    }
    case 'unreserve': {
      if (!(qty > 0))
        throw new Error('unreserve quantity must be greater than zero');
      if (reserved + 1e-12 < qty) {
        throw new Error(
          `Insufficient reserved quantity (have ${formatDecimal(reserved)}, need ${formatDecimal(qty)})`,
        );
      }
      reserved -= qty;
      break;
    }
    case 'adjustment': {
      if (qty === 0) throw new Error('adjustment quantity must be non-zero');
      onHand += qty;
      if (onHand + 1e-12 < 0) {
        throw new Error('adjustment would make quantity_on_hand negative');
      }
      if (onHand + 1e-12 < reserved) {
        throw new Error(
          'adjustment would make quantity_on_hand less than reserved',
        );
      }
      break;
    }
    default: {
      const _exhaustive: never = movementType;
      return _exhaustive;
    }
  }

  const quantityOnHand = formatDecimal(onHand);
  const quantityReserved = formatDecimal(reserved);
  return {
    quantityOnHand,
    quantityReserved,
    quantityAvailable: computeAvailable(quantityOnHand, quantityReserved),
  };
}

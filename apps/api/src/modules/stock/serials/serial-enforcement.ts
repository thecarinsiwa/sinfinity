/**
 * Pure guards for serialized product movements.
 * Quantity for serialized SKUs must be a positive whole number matching serial count.
 */

export function parseIntegerQuantity(quantity: string | number): number {
  const n = Number(quantity);
  if (!Number.isFinite(n)) {
    throw new Error('Invalid quantity');
  }
  if (Math.abs(n - Math.round(n)) > 1e-9) {
    throw new Error('Serialized products require a whole-number quantity');
  }
  return Math.round(n);
}

/**
 * When product.is_serialized, require exactly `expectedCount` serial identifiers.
 */
export function assertSerialCount(
  expectedCount: number,
  serials: readonly string[] | null | undefined,
  label: string,
): asserts serials is string[] {
  if (!serials || serials.length === 0) {
    throw new Error(
      `Serialized product requires ${label} (expected ${expectedCount})`,
    );
  }
  if (serials.length !== expectedCount) {
    throw new Error(
      `Serialized product requires ${expectedCount} ${label}, got ${serials.length}`,
    );
  }
  const unique = new Set(serials.map((s) => s.trim()).filter(Boolean));
  if (unique.size !== serials.length) {
    throw new Error(`${label} must be unique and non-empty`);
  }
}

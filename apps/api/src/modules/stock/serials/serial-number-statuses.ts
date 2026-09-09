export const SERIAL_NUMBER_STATUSES = [
  'in_stock',
  'reserved',
  'shipped',
  'installed',
  'returned',
  'scrapped',
] as const;

export type SerialNumberStatus = (typeof SERIAL_NUMBER_STATUSES)[number];

export const SERIAL_NUMBER_STATUS = {
  IN_STOCK: 'in_stock',
  RESERVED: 'reserved',
  SHIPPED: 'shipped',
  INSTALLED: 'installed',
  RETURNED: 'returned',
  SCRAPPED: 'scrapped',
} as const satisfies Record<string, SerialNumberStatus>;

/**
 * Happy path: in_stock → reserved → shipped → installed
 * returned / scrapped from relevant states.
 */
export const SERIAL_NUMBER_TRANSITIONS: Record<
  SerialNumberStatus,
  readonly SerialNumberStatus[]
> = {
  in_stock: ['reserved', 'shipped', 'scrapped'],
  reserved: ['in_stock', 'shipped', 'scrapped'],
  shipped: ['installed', 'returned'],
  installed: [],
  returned: ['in_stock', 'scrapped'],
  scrapped: [],
};

export function assertSerialNumberTransition(
  from: SerialNumberStatus,
  to: SerialNumberStatus,
): void {
  if (from === to) {
    throw new Error(`Serial number is already "${from}"`);
  }
  const allowed = SERIAL_NUMBER_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid status transition from "${from}" to "${to}"`);
  }
}

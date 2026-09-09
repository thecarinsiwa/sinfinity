/**
 * Global shipping methods (SEA / AIR / ROAD / RAIL).
 * Seeded idempotently via ShippingMethodsSeedService.
 */
export type ShippingMethodDef = {
  code: string;
  name: string;
  description: string;
};

export const SYSTEM_SHIPPING_METHODS: ShippingMethodDef[] = [
  {
    code: 'SEA',
    name: 'Sea freight',
    description: 'Ocean / container shipping',
  },
  {
    code: 'AIR',
    name: 'Air freight',
    description: 'Air cargo / AWB',
  },
  {
    code: 'ROAD',
    name: 'Road freight',
    description: 'Truck / road transport',
  },
  {
    code: 'RAIL',
    name: 'Rail freight',
    description: 'Rail / multimodal rail',
  },
];

export const SHIPPING_METHOD_CODE = {
  SEA: 'SEA',
  AIR: 'AIR',
  ROAD: 'ROAD',
  RAIL: 'RAIL',
} as const;

export type ShippingMethodCode =
  (typeof SHIPPING_METHOD_CODE)[keyof typeof SHIPPING_METHOD_CODE];

import {
  convertAmount,
  customsAmountTotal,
} from './fee-components/currency-conversion';
import { formatDecimal, sumDecimals } from './landed-costs-totals';

export const ALLOCATION_METHODS = ['value', 'weight', 'volume'] as const;
export type AllocationMethod = (typeof ALLOCATION_METHODS)[number];

export type EngineItemInput = {
  id: string;
  quantity: string;
  goodsCost: string;
  /** Pre-resolved weight basis (e.g. shipment weight_kg × qty). */
  weightBasis: string;
  /** Pre-resolved volume basis (e.g. shipment volume_cbm × qty). */
  volumeBasis: string;
};

export type EngineItemResult = {
  id: string;
  quantity: string;
  goodsCost: string;
  allocatedCosts: string;
  unitLandedCost: string;
  totalLandedCost: string;
};

export type EngineResult = {
  goodsCost: string;
  totalAdditionalCosts: string;
  totalLandedCost: string;
  items: EngineItemResult[];
};

/**
 * Allocate `totalAdditional` across items by method.
 * Remainder from 4 dp rounding is applied to the last line with a non-zero basis
 * (or the last item if all bases are zero — caller should reject that case first).
 */
export function allocateAdditionalCosts(
  items: EngineItemInput[],
  totalAdditional: string | number,
  method: AllocationMethod,
): EngineItemResult[] {
  if (items.length === 0) {
    return [];
  }

  const bases = items.map((item) => resolveBasis(item, method));
  const basisSum = bases.reduce((acc, b) => acc + b, 0);
  if (basisSum <= 0) {
    throw new Error(
      `Cannot allocate by ${method}: total allocation basis is zero`,
    );
  }

  const total = Number(totalAdditional);
  const allocated: number[] = [];
  let assigned = 0;

  for (let i = 0; i < items.length; i++) {
    const share = (total * bases[i]) / basisSum;
    const rounded = Number(formatDecimal(share));
    allocated.push(rounded);
    assigned += rounded;
  }

  const remainder = Number(formatDecimal(total - assigned));
  if (remainder !== 0) {
    let target = items.length - 1;
    for (let i = items.length - 1; i >= 0; i--) {
      if (bases[i] > 0) {
        target = i;
        break;
      }
    }
    allocated[target] = Number(formatDecimal(allocated[target] + remainder));
  }

  return items.map((item, i) => {
    const goods = Number(item.goodsCost);
    const qty = Number(item.quantity);
    const alloc = allocated[i];
    const lineTotal = Number(formatDecimal(goods + alloc));
    if (!(qty > 0)) {
      throw new Error(`Item ${item.id} quantity must be greater than zero`);
    }
    const unit = Number(formatDecimal(lineTotal / qty));
    return {
      id: item.id,
      quantity: formatDecimal(qty),
      goodsCost: formatDecimal(goods),
      allocatedCosts: formatDecimal(alloc),
      unitLandedCost: formatDecimal(unit),
      totalLandedCost: formatDecimal(lineTotal),
    };
  });
}

export function computeLandedCostTotals(
  items: EngineItemInput[],
  feeAmountsInHeaderCurrency: Array<string | number>,
  method: AllocationMethod,
): EngineResult {
  const goodsCost = sumDecimals(items.map((i) => i.goodsCost));
  const totalAdditionalCosts = sumDecimals(feeAmountsInHeaderCurrency);
  const totalLandedCost = sumDecimals([goodsCost, totalAdditionalCosts]);
  const allocatedItems = allocateAdditionalCosts(
    items,
    totalAdditionalCosts,
    method,
  );

  return {
    goodsCost,
    totalAdditionalCosts,
    totalLandedCost,
    items: allocatedItems,
  };
}

function resolveBasis(item: EngineItemInput, method: AllocationMethod): number {
  switch (method) {
    case 'value':
      return Number(item.goodsCost);
    case 'weight':
      return Number(item.weightBasis);
    case 'volume':
      return Number(item.volumeBasis);
    default: {
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}

/** Re-export helpers used by the service layer / tests. */
export { convertAmount, customsAmountTotal };

import {
  applyQuantityDelta,
  computeAvailable,
  formatDecimal,
  type InventoryQtyState,
  type MovementType,
} from './inventory-quantities';

describe('inventory-quantities', () => {
  const empty: InventoryQtyState = {
    quantityOnHand: '0.0000',
    quantityReserved: '0.0000',
    quantityAvailable: '0.0000',
  };

  it('computes available as on_hand - reserved', () => {
    expect(computeAvailable('100', '25')).toBe('75.0000');
  });

  it('applies in then reserve then out', () => {
    let state = applyQuantityDelta(empty, 'in', '10');
    expect(state).toEqual({
      quantityOnHand: '10.0000',
      quantityReserved: '0.0000',
      quantityAvailable: '10.0000',
    });

    state = applyQuantityDelta(state, 'reserve', '3');
    expect(state.quantityReserved).toBe('3.0000');
    expect(state.quantityAvailable).toBe('7.0000');

    state = applyQuantityDelta(state, 'out', '7');
    expect(state.quantityOnHand).toBe('3.0000');
    expect(state.quantityAvailable).toBe('0.0000');
  });

  it('unreserves back to available', () => {
    let state = applyQuantityDelta(empty, 'in', '10');
    state = applyQuantityDelta(state, 'reserve', '4');
    state = applyQuantityDelta(state, 'unreserve', '4');
    expect(state.quantityReserved).toBe('0.0000');
    expect(state.quantityAvailable).toBe('10.0000');
  });

  it('rejects out when available is insufficient', () => {
    const state = applyQuantityDelta(empty, 'in', '5');
    const reserved = applyQuantityDelta(state, 'reserve', '3');
    expect(() => applyQuantityDelta(reserved, 'out', '3')).toThrow(
      /Insufficient available/,
    );
  });

  it('rejects reserve when available is insufficient', () => {
    const state = applyQuantityDelta(empty, 'in', '2');
    expect(() => applyQuantityDelta(state, 'reserve', '3')).toThrow(
      /Insufficient available quantity to reserve/,
    );
  });

  it('rejects unreserve above reserved', () => {
    const state = applyQuantityDelta(empty, 'in', '5');
    expect(() => applyQuantityDelta(state, 'unreserve', '1')).toThrow(
      /Insufficient reserved/,
    );
  });

  it('applies signed adjustment', () => {
    const state = applyQuantityDelta(empty, 'in', '20');
    const next = applyQuantityDelta(state, 'adjustment', '-5');
    expect(next.quantityOnHand).toBe('15.0000');
  });

  it('rejects adjustment that would go below reserved', () => {
    let state = applyQuantityDelta(empty, 'in', '10');
    state = applyQuantityDelta(state, 'reserve', '6');
    expect(() => applyQuantityDelta(state, 'adjustment', '-5')).toThrow(
      /less than reserved/,
    );
  });

  it('rejects zero adjustment', () => {
    expect(() => applyQuantityDelta(empty, 'adjustment', '0')).toThrow(
      /non-zero/,
    );
  });

  it('formats decimals to 4 dp', () => {
    expect(formatDecimal(1.2)).toBe('1.2000');
  });
});

describe('applyQuantityDelta movement types', () => {
  const types: MovementType[] = [
    'in',
    'out',
    'reserve',
    'unreserve',
    'adjustment',
  ];
  it('covers all supported movement types in the type union', () => {
    expect(types).toHaveLength(5);
  });
});

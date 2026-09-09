import {
  allocateAdditionalCosts,
  computeLandedCostTotals,
  convertAmount,
  customsAmountTotal,
  type AllocationMethod,
} from './landed-costs-engine';

describe('landed-costs-engine', () => {
  it('computes totals for USD goods + USD shipping + CDF customs', () => {
    // Header USD. Shipping 10 USD. Customs 27_500 CDF @ 0.0004 = 11 USD.
    const customsInUsd = convertAmount(
      customsAmountTotal('20000', '5000', '2500'),
      '0.0004',
    );
    expect(customsInUsd).toBe('11.0000');

    const result = computeLandedCostTotals(
      [
        {
          id: 'item-a',
          quantity: '2',
          goodsCost: '600.0000',
          weightBasis: '0',
          volumeBasis: '0',
        },
        {
          id: 'item-b',
          quantity: '1',
          goodsCost: '400.0000',
          weightBasis: '0',
          volumeBasis: '0',
        },
      ],
      ['10.0000', customsInUsd],
      'value',
    );

    expect(result.goodsCost).toBe('1000.0000');
    expect(result.totalAdditionalCosts).toBe('21.0000');
    expect(result.totalLandedCost).toBe('1021.0000');

    // 60% / 40% of 21 → 12.6000 / 8.4000
    expect(result.items[0].allocatedCosts).toBe('12.6000');
    expect(result.items[0].totalLandedCost).toBe('612.6000');
    expect(result.items[0].unitLandedCost).toBe('306.3000');
    expect(result.items[1].allocatedCosts).toBe('8.4000');
    expect(result.items[1].totalLandedCost).toBe('408.4000');
    expect(result.items[1].unitLandedCost).toBe('408.4000');
  });

  it('allocates by weight', () => {
    const items = allocateAdditionalCosts(
      [
        {
          id: 'a',
          quantity: '1',
          goodsCost: '100',
          weightBasis: '30',
          volumeBasis: '0',
        },
        {
          id: 'b',
          quantity: '1',
          goodsCost: '900',
          weightBasis: '70',
          volumeBasis: '0',
        },
      ],
      '100',
      'weight',
    );
    expect(items[0].allocatedCosts).toBe('30.0000');
    expect(items[1].allocatedCosts).toBe('70.0000');
  });

  it('allocates by volume', () => {
    const items = allocateAdditionalCosts(
      [
        {
          id: 'a',
          quantity: '1',
          goodsCost: '1',
          weightBasis: '0',
          volumeBasis: '1.5',
        },
        {
          id: 'b',
          quantity: '1',
          goodsCost: '1',
          weightBasis: '0',
          volumeBasis: '0.5',
        },
      ],
      '40',
      'volume',
    );
    expect(items[0].allocatedCosts).toBe('30.0000');
    expect(items[1].allocatedCosts).toBe('10.0000');
  });

  it('puts rounding remainder on the last non-zero basis line', () => {
    const items = allocateAdditionalCosts(
      [
        {
          id: 'a',
          quantity: '1',
          goodsCost: '1',
          weightBasis: '1',
          volumeBasis: '0',
        },
        {
          id: 'b',
          quantity: '1',
          goodsCost: '1',
          weightBasis: '1',
          volumeBasis: '0',
        },
        {
          id: 'c',
          quantity: '1',
          goodsCost: '1',
          weightBasis: '1',
          volumeBasis: '0',
        },
      ],
      '10',
      'weight',
    );
    const sum = items.reduce((acc, i) => acc + Number(i.allocatedCosts), 0);
    expect(formatSum(sum)).toBe('10.0000');
  });

  it('rejects zero allocation basis', () => {
    expect(() =>
      allocateAdditionalCosts(
        [
          {
            id: 'a',
            quantity: '1',
            goodsCost: '0',
            weightBasis: '0',
            volumeBasis: '0',
          },
        ],
        '10',
        'value' as AllocationMethod,
      ),
    ).toThrow(/basis is zero/);
  });
});

function formatSum(value: number): string {
  return value.toFixed(4);
}

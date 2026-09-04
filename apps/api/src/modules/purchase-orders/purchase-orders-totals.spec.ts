import {
  computeHeaderTotals,
  computeLineTotal,
  formatDecimal,
} from './purchase-orders-totals';

describe('purchase-orders-totals', () => {
  it('formats decimals to 4 dp', () => {
    expect(formatDecimal(2)).toBe('2.0000');
  });

  it('computes line and header totals without tax', () => {
    expect(computeLineTotal('2', '95')).toBe('190.0000');
    expect(computeHeaderTotals(['190.0000', '10.0000'])).toEqual({
      subtotal: '200.0000',
      taxAmount: '0.0000',
      totalAmount: '200.0000',
    });
  });
});

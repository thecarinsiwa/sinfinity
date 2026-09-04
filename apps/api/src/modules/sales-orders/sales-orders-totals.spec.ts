import {
  computeHeaderTotals,
  computeLineTotals,
  formatDecimal,
} from './sales-orders-totals';

describe('sales-orders-totals', () => {
  it('formats decimals to 4 dp', () => {
    expect(formatDecimal(2)).toBe('2.0000');
  });

  it('computes line HT and exclusive tax', () => {
    const result = computeLineTotals({
      quantity: '2',
      unitPrice: '100',
      taxRatePercent: '16',
    });
    expect(result.lineTotal).toBe('200.0000');
    expect(result.lineTax).toBe('32.0000');
  });

  it('sums header totals', () => {
    const totals = computeHeaderTotals([
      { lineTotal: '200.0000', lineTax: '32.0000' },
    ]);
    expect(totals.subtotal).toBe('200.0000');
    expect(totals.taxAmount).toBe('32.0000');
    expect(totals.totalAmount).toBe('232.0000');
  });
});

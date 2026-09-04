import {
  computeHeaderTotals,
  computeLineTotals,
  formatDecimal,
} from './quotations-totals';

describe('quotations-totals', () => {
  it('formats decimals to 4 dp', () => {
    expect(formatDecimal(1.2)).toBe('1.2000');
  });

  it('computes line HT after discount and tax exclusive', () => {
    const result = computeLineTotals({
      quantity: '2',
      unitPrice: '100',
      discountPercent: '10',
      taxRatePercent: '16',
    });
    // 2 * 100 * 0.9 = 180 HT; tax = 180 * 0.16 = 28.8
    expect(result.lineTotal).toBe('180.0000');
    expect(result.lineTax).toBe('28.8000');
  });

  it('sums header totals', () => {
    const totals = computeHeaderTotals([
      { lineTotal: '180.0000', lineTax: '28.8000' },
      { lineTotal: '50.0000', lineTax: '0.0000' },
    ]);
    expect(totals.subtotal).toBe('230.0000');
    expect(totals.taxAmount).toBe('28.8000');
    expect(totals.totalAmount).toBe('258.8000');
  });
});

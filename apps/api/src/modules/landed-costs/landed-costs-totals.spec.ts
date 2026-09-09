import { formatDecimal, sumDecimals } from './landed-costs-totals';

describe('landed-costs-totals', () => {
  it('formats to 4 decimal places', () => {
    expect(formatDecimal(10)).toBe('10.0000');
    expect(formatDecimal(9.5)).toBe('9.5000');
  });

  it('sums decimal strings', () => {
    expect(sumDecimals(['100.0000', '50.5000', '0.2500'])).toBe('150.7500');
  });
});

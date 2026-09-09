import {
  convertAmount,
  customsAmountTotal,
  LANDED_COST_FX_RULE,
} from './currency-conversion';

describe('currency-conversion', () => {
  it('documents the header-currency conversion rule', () => {
    expect(LANDED_COST_FX_RULE).toContain('header currency_id');
    expect(LANDED_COST_FX_RULE).toContain('exchange_rates');
  });

  it('converts CDF fees to USD with a known rate', () => {
    // 27_500 CDF × 0.0004 = 11 USD
    expect(convertAmount('27500', '0.0004')).toBe('11.0000');
  });

  it('sums customs components before FX', () => {
    expect(customsAmountTotal('20000', '5000', '2500')).toBe('27500.0000');
  });

  it('identity rate leaves amount unchanged', () => {
    expect(convertAmount('10.5000', '1')).toBe('10.5000');
  });
});

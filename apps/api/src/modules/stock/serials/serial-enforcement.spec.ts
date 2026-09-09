import {
  assertSerialCount,
  parseIntegerQuantity,
} from './serial-enforcement';

describe('serial-enforcement', () => {
  it('parseIntegerQuantity accepts whole numbers', () => {
    expect(parseIntegerQuantity('3')).toBe(3);
    expect(parseIntegerQuantity('3.0000')).toBe(3);
  });

  it('parseIntegerQuantity rejects fractions', () => {
    expect(() => parseIntegerQuantity('2.5')).toThrow(/whole-number/);
  });

  it('assertSerialCount requires exact unique length', () => {
    expect(() => assertSerialCount(2, undefined, 'serialIds')).toThrow(
      /requires serialIds/,
    );
    expect(() => assertSerialCount(2, ['a'], 'serialIds')).toThrow(
      /requires 2 serialIds/,
    );
    expect(() => assertSerialCount(2, ['a', 'a'], 'serialIds')).toThrow(
      /unique/,
    );
    expect(() =>
      assertSerialCount(2, ['a', 'b'], 'serialIds'),
    ).not.toThrow();
  });
});

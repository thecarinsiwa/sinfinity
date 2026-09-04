import { parseTtlToMs, parseTtlToSeconds } from './parse-ttl';

describe('parseTtl', () => {
  it('parses minutes and days', () => {
    expect(parseTtlToSeconds('15m')).toBe(900);
    expect(parseTtlToMs('7d')).toBe(7 * 86_400_000);
  });

  it('rejects invalid format', () => {
    expect(() => parseTtlToMs('15')).toThrow(/Invalid TTL/);
  });
});

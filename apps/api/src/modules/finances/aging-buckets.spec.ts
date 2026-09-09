import { computeAgingBucket } from './aging-buckets';

describe('aging-buckets', () => {
  it('returns null without due date', () => {
    expect(computeAgingBucket(null)).toBeNull();
    expect(computeAgingBucket(undefined)).toBeNull();
  });

  it('buckets days past due', () => {
    const asOf = new Date('2026-05-01T12:00:00.000Z');
    expect(computeAgingBucket('2026-04-20', asOf)).toBe('0-30');
    expect(computeAgingBucket('2026-03-15', asOf)).toBe('31-60');
    expect(computeAgingBucket('2026-02-10', asOf)).toBe('61-90');
    expect(computeAgingBucket('2025-12-01', asOf)).toBe('90+');
  });

  it('treats not-yet-due as 0-30', () => {
    const asOf = new Date('2026-05-01T12:00:00.000Z');
    expect(computeAgingBucket('2026-06-01', asOf)).toBe('0-30');
  });
});

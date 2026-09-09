export const AGING_BUCKETS = ['0-30', '31-60', '61-90', '90+'] as const;

export type AgingBucket = (typeof AGING_BUCKETS)[number];

/**
 * Days past due relative to `asOf` (defaults to today UTC date).
 * Not yet due → 0-30.
 */
export function computeAgingBucket(
  dueDate: string | null | undefined,
  asOf: Date = new Date(),
): AgingBucket | null {
  if (dueDate == null || dueDate === '') {
    return null;
  }
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00.000Z`);
  const today = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()),
  );
  const daysPast = Math.floor(
    (today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (daysPast <= 30) return '0-30';
  if (daysPast <= 60) return '31-60';
  if (daysPast <= 90) return '61-90';
  return '90+';
}

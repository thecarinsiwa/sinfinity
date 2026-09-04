/**
 * Parse TTL strings like `15m`, `7d`, `3600s` into milliseconds.
 */
export function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/i.exec(ttl.trim());
  if (!match) {
    throw new Error(`Invalid TTL format: ${ttl}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * multipliers[unit];
}

export function parseTtlToSeconds(ttl: string): number {
  return Math.floor(parseTtlToMs(ttl) / 1000);
}

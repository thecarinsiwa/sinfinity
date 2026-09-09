/** Decimal string math for landed cost goods totals (4 dp). */

export function formatDecimal(value: number, scale = 4): string {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid decimal value');
  }
  return value.toFixed(scale);
}

export function sumDecimals(values: Array<string | number>): string {
  let total = 0;
  for (const value of values) {
    total += Number(value);
  }
  return formatDecimal(total);
}

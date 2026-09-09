/** Decimal string math for purchase order totals (4 dp). No tax lines on PO items. */

export function formatDecimal(value: number, scale = 4): string {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid decimal value');
  }
  return value.toFixed(scale);
}

export function computeLineTotal(
  quantity: string | number,
  unitPrice: string | number,
): string {
  return formatDecimal(Number(quantity) * Number(unitPrice));
}

export function computeHeaderTotals(
  lineTotals: Array<string | number>,
): { subtotal: string; taxAmount: string; totalAmount: string } {
  let subtotal = 0;
  for (const line of lineTotals) {
    subtotal += Number(line);
  }
  return {
    subtotal: formatDecimal(subtotal),
    taxAmount: formatDecimal(0),
    totalAmount: formatDecimal(subtotal),
  };
}

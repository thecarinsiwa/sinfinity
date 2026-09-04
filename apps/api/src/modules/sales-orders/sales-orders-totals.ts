/** Decimal string math for sales order totals (4 dp). */

export function formatDecimal(value: number, scale = 4): string {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid decimal value');
  }
  return value.toFixed(scale);
}

export type LineTotalsInput = {
  quantity: string;
  unitPrice: string;
  taxRatePercent?: string | null;
};

export type LineTotalsResult = {
  lineTotal: string;
  lineTax: string;
};

/** line_total = qty × unitPrice (HT); lineTax = HT × taxRate%/100 */
export function computeLineTotals(input: LineTotalsInput): LineTotalsResult {
  const quantity = Number(input.quantity);
  const unitPrice = Number(input.unitPrice);
  const taxRate =
    input.taxRatePercent != null ? Number(input.taxRatePercent) : 0;
  const lineNet = quantity * unitPrice;
  const lineTax = lineNet * (taxRate / 100);
  return {
    lineTotal: formatDecimal(lineNet),
    lineTax: formatDecimal(lineTax),
  };
}

export type HeaderTotalsResult = {
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
};

export function computeHeaderTotals(
  lines: Array<{ lineTotal: string; lineTax: string }>,
): HeaderTotalsResult {
  let subtotal = 0;
  let taxAmount = 0;
  for (const line of lines) {
    subtotal += Number(line.lineTotal);
    taxAmount += Number(line.lineTax);
  }
  return {
    subtotal: formatDecimal(subtotal),
    taxAmount: formatDecimal(taxAmount),
    totalAmount: formatDecimal(subtotal + taxAmount),
  };
}

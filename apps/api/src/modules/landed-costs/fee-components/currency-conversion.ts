import { formatDecimal } from '../landed-costs-totals';

/**
 * Currency conversion rule for landed cost ancillary fees (Phase 12 · Coût rendu).
 *
 * Fee rows (`shipping_costs`, `customs_costs`, `local_transport_costs`,
 * `inspection_costs`, `handling_costs`, `other_procurement_costs`) store amounts
 * in their own `currency_id` (original invoice / DGDA currency).
 *
 * Conversion happens only on `POST /landed-costs/:id/calculate`:
 * 1. Target currency = header `landed_costs.currency_id`.
 * 2. If fee `currency_id` is null or equal to the header → rate `1`.
 * 3. Otherwise resolve `exchange_rates` via latest rate with
 *    `rate_date <=` calculation date (UTC day), from fee currency → header currency.
 * 4. Missing rate → `400 Bad Request` (do not invent a rate).
 * 5. Converted amount = `amount × rate` (4 dp). For customs:
 *    `(duties_amount + vat_amount + other_fees) × rate`.
 * 6. Sum of converted fees → `total_additional_costs`; goods lines stay in
 *    header currency (no FX on `landed_cost_items.goods_cost`).
 *
 * CRUD of fee rows never converts — it only persists the source currency amount.
 */
export const LANDED_COST_FX_RULE =
  'On calculate, convert each fee amount to the landed cost header currency_id ' +
  'using exchange_rates (latest rate_date ≤ calculation UTC date). Same/null ' +
  'currency → rate 1; missing rate → 400. Fee rows keep their original currency.';

/**
 * Apply an exchange rate to an amount (pure; no DB).
 * `rate` is the multiplier from source currency to target (header) currency.
 */
export function convertAmount(
  amount: string | number,
  rate: string | number,
): string {
  return formatDecimal(Number(amount) * Number(rate));
}

/** Customs line total before FX. */
export function customsAmountTotal(
  duties: string | number,
  vat: string | number,
  otherFees: string | number,
): string {
  return formatDecimal(Number(duties) + Number(vat) + Number(otherFees));
}
